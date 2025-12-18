const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const bodyParser = require("body-parser");
const { ethers } = require("ethers");
require("dotenv").config();

const app = express();

// MongoDB connection
const uri = process.env.MONGO_URI || 
  "mongodb+srv://harshitacademia_db_user:i9B8EJejeTvBZEQw@decluster8n.htjwxef.mongodb.net/?retryWrites=true&w=majority&appName=decluster8n";

let client;
let db;

// Chain configurations
const CHAIN_CONFIG = {
  240: {
    name: "Cronos zkEVM Testnet",
    rpc: process.env.CRONOS_RPC_URL || "https://testnet.zkevm.cronos.org",
    symbol: "zkCRO"
  },
  84532: {
    name: "Base Sepolia",
    rpc: process.env.BASE_RPC_URL || "https://sepolia.base.org",
    symbol: "ETH"
  },
  80002: {
    name: "Polygon Amoy",
    rpc: process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology",
    symbol: "MATIC"
  },
  11155111: {
    name: "Ethereum Sepolia",
    rpc: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
    symbol: "ETH"
  }
};

// Master wallet for executing payments
let masterWallet = null;
const walletProviders = {};

function initializeWallets() {
  const privateKey = process.env.MASTER_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    console.warn("[NEXUS] No MASTER_WALLET_PRIVATE_KEY set - payment execution disabled");
    return;
  }

  for (const [chainId, config] of Object.entries(CHAIN_CONFIG)) {
    try {
      const provider = new ethers.JsonRpcProvider(config.rpc);
      walletProviders[chainId] = new ethers.Wallet(privateKey, provider);
      console.log(`[NEXUS] Initialized wallet for ${config.name}`);
    } catch (error) {
      console.error(`[NEXUS] Failed to init wallet for chain ${chainId}:`, error.message);
    }
  }
}

app.use(cors());
app.use(bodyParser.json());

async function connectDB() {
  if (db) return db;
  if (!client) {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
  }
  if (!client.topology?.isConnected()) {
    await client.connect();
    console.log("[NEXUS] Connected to MongoDB");
  }
  db = client.db("d8n_main");
  return db;
}

// ================== ORIGINAL D8N ENDPOINTS ==================

// Save a Workflow
app.post("/api/workflows", async (req, res) => {
  const { user_wallet, workflow_name, workflow_data } = req.body;

  if (!user_wallet || !workflow_name || !workflow_data) {
    return res.status(400).json({ message: "Missing required workflow data." });
  }

  try {
    const database = await connectDB();
    const collection = database.collection("workflows");

    const filter = { walletAddress: user_wallet, workflowName: workflow_name };
    const updateDoc = {
      $set: {
        walletAddress: user_wallet,
        workflowName: workflow_name,
        workflowData: workflow_data,
        updatedAt: new Date(),
      },
    };
    const options = { upsert: true };

    const result = await collection.updateOne(filter, updateDoc, options);
    res.status(201).json({ message: "Workflow saved successfully!", data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save workflow." });
  }
});

// Get all Workflows for a Wallet
app.get("/api/workflows/:walletAddress", async (req, res) => {
  const { walletAddress } = req.params;

  if (!walletAddress) {
    return res.status(400).json({ message: "Wallet address is required." });
  }

  try {
    const database = await connectDB();
    const collection = database.collection("workflows");
    const workflows = await collection.find({ walletAddress }).toArray();
    res.status(200).json(workflows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch workflows." });
  }
});

// ================== NEXUS BALANCE ENDPOINTS ==================

/**
 * GET /api/nexus/balance/:wallet
 * Get virtual balance for all chains
 */
app.get("/api/nexus/balance/:wallet", async (req, res) => {
  const { wallet } = req.params;

  try {
    const database = await connectDB();
    const balances = database.collection("nexus_balances");
    
    const userBalances = await balances.find({ 
      wallet: wallet.toLowerCase() 
    }).toArray();

    const result = {};
    for (const balance of userBalances) {
      result[balance.chainId] = {
        virtual: balance.virtualBalance,
        chainName: CHAIN_CONFIG[balance.chainId]?.name || "Unknown",
        symbol: CHAIN_CONFIG[balance.chainId]?.symbol || "TOKEN",
        lastUpdated: balance.updatedAt
      };
    }

    res.json({ 
      success: true, 
      wallet: wallet.toLowerCase(),
      balances: result 
    });
  } catch (err) {
    console.error("[NEXUS] Balance fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch balance" });
  }
});

/**
 * GET /api/nexus/balance/:wallet/:chainId
 * Get virtual balance for specific chain
 */
app.get("/api/nexus/balance/:wallet/:chainId", async (req, res) => {
  const { wallet, chainId } = req.params;

  try {
    const database = await connectDB();
    const balances = database.collection("nexus_balances");
    
    const balance = await balances.findOne({ 
      wallet: wallet.toLowerCase(),
      chainId: parseInt(chainId)
    });

    res.json({ 
      success: true, 
      wallet: wallet.toLowerCase(),
      chainId: parseInt(chainId),
      virtualBalance: balance?.virtualBalance || "0",
      virtualBalanceFormatted: ethers.formatEther(balance?.virtualBalance || "0"),
      chainName: CHAIN_CONFIG[chainId]?.name || "Unknown"
    });
  } catch (err) {
    console.error("[NEXUS] Balance fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch balance" });
  }
});

/**
 * POST /api/nexus/deposit
 * Record a deposit (called when blockchain deposit is detected)
 */
app.post("/api/nexus/deposit", async (req, res) => {
  const { wallet, chainId, amount, txHash } = req.body;

  if (!wallet || !chainId || !amount || !txHash) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const database = await connectDB();
    const balances = database.collection("nexus_balances");
    const deposits = database.collection("nexus_deposits");
    const transactions = database.collection("nexus_transactions");

    // Check if deposit already processed
    const existingDeposit = await deposits.findOne({ txHash });
    if (existingDeposit) {
      return res.status(400).json({ success: false, message: "Deposit already processed" });
    }

    // Record deposit
    await deposits.insertOne({
      wallet: wallet.toLowerCase(),
      chainId: parseInt(chainId),
      amount,
      txHash,
      processedAt: new Date()
    });

    // Update virtual balance
    const amountBigInt = BigInt(amount);
    await balances.updateOne(
      { wallet: wallet.toLowerCase(), chainId: parseInt(chainId) },
      { 
        $set: { updatedAt: new Date() },
        $inc: { virtualBalance: amount }
      },
      { upsert: true }
    );

    // Refresh to get actual balance (since we stored as string)
    const currentBalance = await balances.findOne({ 
      wallet: wallet.toLowerCase(), 
      chainId: parseInt(chainId) 
    });

    // If balance doesn't exist or is not properly set, initialize it
    if (!currentBalance?.virtualBalance) {
      await balances.updateOne(
        { wallet: wallet.toLowerCase(), chainId: parseInt(chainId) },
        { $set: { virtualBalance: amount, updatedAt: new Date() } }
      );
    }

    // Record transaction
    await transactions.insertOne({
      wallet: wallet.toLowerCase(),
      type: "deposit",
      chainId: parseInt(chainId),
      amount,
      txHash,
      timestamp: new Date(),
      status: "completed"
    });

    console.log(`[NEXUS] Deposit recorded: ${ethers.formatEther(amount)} on chain ${chainId} from ${wallet}`);

    res.json({ 
      success: true, 
      message: "Deposit recorded successfully",
      txHash 
    });
  } catch (err) {
    console.error("[NEXUS] Deposit error:", err);
    res.status(500).json({ success: false, message: "Failed to process deposit" });
  }
});

/**
 * POST /api/nexus/pay
 * Execute payment to a provider
 */
app.post("/api/nexus/pay", async (req, res) => {
  const { wallet, provider, amount, chainId } = req.body;

  if (!wallet || !provider || !amount || !chainId) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const chainIdNum = parseInt(chainId);

  try {
    const database = await connectDB();
    const balances = database.collection("nexus_balances");
    const transactions = database.collection("nexus_transactions");

    // Check virtual balance
    const balance = await balances.findOne({ 
      wallet: wallet.toLowerCase(), 
      chainId: chainIdNum 
    });

    const virtualBalance = BigInt(balance?.virtualBalance || "0");
    const paymentAmount = BigInt(amount);

    if (virtualBalance < paymentAmount) {
      return res.status(400).json({ 
        success: false, 
        message: "Insufficient virtual balance",
        required: amount,
        available: balance?.virtualBalance || "0"
      });
    }

    // Get master wallet for this chain
    const masterWalletForChain = walletProviders[chainIdNum];
    
    let txHash;
    let status = "completed";

    if (masterWalletForChain) {
      try {
        // Execute real on-chain payment
        console.log(`[NEXUS] Sending ${ethers.formatEther(amount)} to ${provider} on chain ${chainIdNum}`);
        
        const tx = await masterWalletForChain.sendTransaction({
          to: provider,
          value: paymentAmount,
          gasLimit: 21000n
        });

        const receipt = await tx.wait();
        txHash = receipt.hash;
        console.log(`[NEXUS] Payment successful: ${txHash}`);
      } catch (txError) {
        console.error("[NEXUS] Payment transaction failed:", txError.message);
        return res.status(500).json({ 
          success: false, 
          message: "Payment transaction failed: " + txError.message 
        });
      }
    } else {
      // Demo mode - simulate transaction
      txHash = "0x" + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
      console.log(`[NEXUS] Demo mode - simulated tx: ${txHash}`);
    }

    // Deduct from virtual balance
    const newBalance = (virtualBalance - paymentAmount).toString();
    await balances.updateOne(
      { wallet: wallet.toLowerCase(), chainId: chainIdNum },
      { $set: { virtualBalance: newBalance, updatedAt: new Date() } }
    );

    // Record transaction
    await transactions.insertOne({
      wallet: wallet.toLowerCase(),
      type: "payment",
      chainId: chainIdNum,
      amount,
      provider,
      txHash,
      timestamp: new Date(),
      status
    });

    res.json({ 
      success: true, 
      txHash,
      amountPaid: amount,
      amountFormatted: ethers.formatEther(amount),
      newBalance,
      newBalanceFormatted: ethers.formatEther(newBalance)
    });
  } catch (err) {
    console.error("[NEXUS] Payment error:", err);
    res.status(500).json({ success: false, message: "Failed to execute payment" });
  }
});

/**
 * GET /api/nexus/transactions/:wallet
 * Get transaction history
 */
app.get("/api/nexus/transactions/:wallet", async (req, res) => {
  const { wallet } = req.params;
  const limit = parseInt(req.query.limit) || 50;
  const chainId = req.query.chainId ? parseInt(req.query.chainId) : null;

  try {
    const database = await connectDB();
    const transactions = database.collection("nexus_transactions");
    
    const query = { wallet: wallet.toLowerCase() };
    if (chainId) {
      query.chainId = chainId;
    }

    const txs = await transactions
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    // Format transactions
    const formatted = txs.map(tx => ({
      ...tx,
      amountFormatted: ethers.formatEther(tx.amount),
      chainName: CHAIN_CONFIG[tx.chainId]?.name || "Unknown",
      symbol: CHAIN_CONFIG[tx.chainId]?.symbol || "TOKEN"
    }));

    res.json({ 
      success: true, 
      wallet: wallet.toLowerCase(),
      count: formatted.length,
      transactions: formatted 
    });
  } catch (err) {
    console.error("[NEXUS] Transactions fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
});

/**
 * GET /api/nexus/supported-chains
 * Get list of supported chains
 */
app.get("/api/nexus/supported-chains", (req, res) => {
  const chains = Object.entries(CHAIN_CONFIG).map(([id, config]) => ({
    chainId: parseInt(id),
    ...config
  }));
  res.json({ success: true, chains });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    service: "d8n-nexus-backend",
    timestamp: new Date().toISOString()
  });
});

// Initialize wallets and export
initializeWallets();

module.exports = app;

// Start server if running directly
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`[NEXUS] Backend server running on port ${PORT}`);
  });
}
