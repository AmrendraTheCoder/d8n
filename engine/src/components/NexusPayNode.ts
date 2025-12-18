import type { Node } from "../interfaces/Node.js";
import axios from "axios";

/**
 * NexusPayNode - Handles HTTP 402 Payment Required flow
 * 
 * This node:
 * 1. Calls a URL that may return 402 Payment Required
 * 2. If 402, parses payment headers and calls Nexus backend to pay
 * 3. Retries the request with payment proof
 * 4. Returns the unlocked data
 */
export class NexusPayNode implements Node {
  id: string;
  label: string;
  type: string = "nexusPay";
  inputs: Record<string, any>;
  outputs: Record<string, any> = {};

  // Configuration
  url: string;
  walletAddress: string;
  chainId: number;
  nexusBackendUrl: string;

  constructor(
    id: string,
    label: string,
    url: string,
    walletAddress: string,
    chainId: number = 240,
    nexusBackendUrl: string = "http://localhost:3001"
  ) {
    this.id = id;
    this.label = label;
    this.url = url;
    this.walletAddress = walletAddress;
    this.chainId = chainId;
    this.nexusBackendUrl = nexusBackendUrl;
    this.inputs = { activate: true };
  }

  async execute(): Promise<void> {
    console.log(`[NEXUS PAY] Starting request to: ${this.url}`);

    try {
      // First attempt - may return 402
      const firstResponse = await this.makeRequest();
      
      if (firstResponse.status === 200) {
        // No payment needed - return data directly
        console.log(`[NEXUS PAY] No payment required, data received`);
        this.outputs.data = firstResponse.data;
        this.outputs.txHash = null;
        this.outputs.cost = "0";
        return;
      }

      if (firstResponse.status !== 402) {
        throw new Error(`Unexpected status: ${firstResponse.status}`);
      }

      // Parse 402 response headers
      const paymentDetails = this.parsePaymentHeaders(firstResponse);
      console.log(`[NEXUS PAY] Payment required: ${paymentDetails.costFormatted} to ${paymentDetails.address}`);

      // Execute payment via Nexus backend
      const paymentResult = await this.executePayment(paymentDetails);
      console.log(`[NEXUS PAY] Payment successful: ${paymentResult.txHash}`);

      // Retry with payment proof
      const secondResponse = await this.makeRequest(paymentResult.txHash);
      
      if (secondResponse.status !== 200) {
        throw new Error(`Payment accepted but data not returned: ${secondResponse.status}`);
      }

      console.log(`[NEXUS PAY] Data unlocked successfully`);
      this.outputs.data = secondResponse.data;
      this.outputs.txHash = paymentResult.txHash;
      this.outputs.cost = paymentDetails.cost;
      this.outputs.costFormatted = paymentDetails.costFormatted;

    } catch (error: any) {
      console.error(`[NEXUS PAY] Error:`, error.message);
      this.outputs.error = error.message;
      this.outputs.data = null;
    }
  }

  private async makeRequest(paymentProof?: string): Promise<any> {
    const headers: Record<string, string> = {};
    
    if (paymentProof) {
      headers["X-PAYMENT"] = `${paymentProof}:${this.chainId}`;
    }

    try {
      const response = await axios.get(this.url, { 
        headers,
        validateStatus: (status: number) => status < 500 // Accept 402 as valid response
      });
      return response;
    } catch (error: any) {
      if (error.response) {
        return error.response;
      }
      throw error;
    }
  }

  private parsePaymentHeaders(response: any): {
    address: string;
    cost: string;
    costFormatted: string;
    assetType: string;
    chainId: number;
  } {
    const headers = response.headers;
    const data = response.data;

    // Try headers first, then response body
    const address = headers["x-cronos-address"] || data?.payment?.recipient;
    const cost = headers["x-cost"] || data?.payment?.amount;
    const assetType = headers["x-asset-type"] || data?.payment?.assetType || "native";
    const chainId = parseInt(headers["x-chain-id"] || data?.payment?.supportedChains?.[0]?.chainId || "240");

    if (!address || !cost) {
      throw new Error("Missing payment details in 402 response");
    }

    // Format cost for display
    const costBigInt = BigInt(cost);
    const costFormatted = (Number(costBigInt) / 1e18).toFixed(4);

    return { address, cost, costFormatted, assetType, chainId };
  }

  private async executePayment(paymentDetails: {
    address: string;
    cost: string;
    chainId: number;
  }): Promise<{ txHash: string }> {
    const response = await axios.post(`${this.nexusBackendUrl}/api/nexus/pay`, {
      wallet: this.walletAddress,
      provider: paymentDetails.address,
      amount: paymentDetails.cost,
      chainId: paymentDetails.chainId
    });

    if (!response.data.success) {
      throw new Error(response.data.message || "Payment failed");
    }

    return { txHash: response.data.txHash };
  }
}
