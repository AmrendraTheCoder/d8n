import React, { useState, useEffect } from "react";
import {
    X, TrendingUp, TrendingDown, RefreshCw, BarChart3, Activity,
    Clock, ArrowUpRight, ArrowDownRight, Brain, Sparkles, Loader,
    Target, AlertTriangle, Zap, Play, ChevronDown, ChevronUp
} from "lucide-react";
import { NODE_CONFIG } from "../config/nodeConfig";

// Mock price data generator
const generateMockPriceData = (basePrice, volatility = 0.02, count = 80) => {
    const data = [];
    let price = basePrice;
    const now = Date.now();

    for (let i = count - 1; i >= 0; i--) {
        const change = (Math.random() - 0.5) * 2 * volatility * price;
        price = Math.max(price + change, basePrice * 0.5);
        const high = price * (1 + Math.random() * 0.012);
        const low = price * (1 - Math.random() * 0.012);
        const close = low + Math.random() * (high - low);
        data.push({ time: now - i * 60000, open: price, high, low, close });
        price = close;
    }
    return data;
};

const tokens = [
    { symbol: "ETH", name: "Ethereum", basePrice: 3500 },
    { symbol: "BTC", name: "Bitcoin", basePrice: 98000 },
    { symbol: "CRO", name: "Cronos", basePrice: 0.15 },
    { symbol: "SOL", name: "Solana", basePrice: 180 },
];

const timeframes = ["1H", "4H", "1D", "1W"];

// Mock AI analysis
const mockAnalysis = {
    ETH: { sentiment: "bullish", confidence: 85, rsi: 42, support: 3200, resistance: 3800, signal: "BUY", reason: "Golden cross on 4H" },
    BTC: { sentiment: "neutral", confidence: 65, rsi: 55, support: 92000, resistance: 105000, signal: "HOLD", reason: "Consolidating near ATH" },
    CRO: { sentiment: "bullish", confidence: 72, rsi: 38, support: 0.12, resistance: 0.22, signal: "BUY", reason: "Accumulation detected" },
    SOL: { sentiment: "bullish", confidence: 78, rsi: 45, support: 160, resistance: 200, signal: "BUY", reason: "Strong momentum" },
};

export default function ChartsPanel({ isOpen, onClose, onAddNodes }) {
    const [selectedToken, setSelectedToken] = useState(tokens[0]);
    const [priceData, setPriceData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [timeframe, setTimeframe] = useState("1H");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [showAI, setShowAI] = useState(false);

    useEffect(() => {
        if (isOpen && selectedToken) {
            loadPriceData();
            setAnalysis(null);
            setShowAI(false);
        }
    }, [isOpen, selectedToken, timeframe]);

    const loadPriceData = () => {
        setIsLoading(true);
        setTimeout(() => {
            setPriceData(generateMockPriceData(selectedToken.basePrice));
            setIsLoading(false);
        }, 300);
    };

    const runAnalysis = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            setAnalysis(mockAnalysis[selectedToken.symbol] || mockAnalysis.ETH);
            setIsAnalyzing(false);
        }, 1500);
    };

    const createWorkflow = () => {
        if (!analysis) return;
        const newNodes = [
            { id: `ai-${Date.now()}-0`, type: "custom", position: { x: 100, y: 150 }, data: { label: `Pyth ${selectedToken.symbol}/USD`, type: "pyth-network", inputs: {}, outputs: { price: { type: "float" } }, node_data: { symbol: `${selectedToken.symbol}_USD` } } },
            { id: `ai-${Date.now()}-1`, type: "custom", position: { x: 400, y: 150 }, data: { label: `Price > $${analysis.support}?`, type: "condition", inputs: { price: { type: "float" } }, outputs: { "true-path": { type: "bool" }, "false-path": { type: "bool" } }, node_data: { condition: `price > ${analysis.support}` } } },
            { id: `ai-${Date.now()}-2`, type: "custom", position: { x: 700, y: 100 }, data: { label: `Swap to ${selectedToken.symbol}`, type: "swap", inputs: { activate: { type: "bool" } }, outputs: {}, node_data: {} } },
        ];
        if (onAddNodes) {
            onAddNodes(newNodes);
        }
        onClose();
    };

    const currentPrice = priceData.length > 0 ? priceData[priceData.length - 1].close : selectedToken.basePrice;
    const openPrice = priceData.length > 0 ? priceData[0].open : currentPrice;
    const priceChange = ((currentPrice - openPrice) / openPrice) * 100;
    const isPositive = priceChange >= 0;

    // Chart SVG
    const chartHeight = 200;
    const chartWidth = 400;
    const padding = { top: 10, right: 40, bottom: 20, left: 10 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    const minPrice = priceData.length > 0 ? Math.min(...priceData.map(d => d.low)) * 0.998 : currentPrice * 0.95;
    const maxPrice = priceData.length > 0 ? Math.max(...priceData.map(d => d.high)) * 1.002 : currentPrice * 1.05;
    const priceRange = maxPrice - minPrice || 1;

    const getY = (price) => padding.top + innerHeight - ((price - minPrice) / priceRange) * innerHeight;
    const getX = (index) => padding.left + (index / Math.max(priceData.length - 1, 1)) * innerWidth;

    const linePath = priceData.length > 0 ? `M ${priceData.map((d, i) => `${getX(i)},${getY(d.close)}`).join(" L ")}` : "";
    const areaPath = priceData.length > 0 ? `${linePath} L ${getX(priceData.length - 1)},${chartHeight - padding.bottom} L ${getX(0)},${chartHeight - padding.bottom} Z` : "";

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={onClose}
            />

            {/* Sliding Panel */}
            <div className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <BarChart3 size={20} className="text-slate-600" />
                        <div>
                            <h2 className="font-semibold text-slate-800">Market Analysis</h2>
                            <p className="text-xs text-slate-500">Charts & AI Insights</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Token Selector */}
                    <div className="px-5 py-4 border-b border-slate-100">
                        <div className="flex gap-2">
                            {tokens.map((token) => (
                                <button
                                    key={token.symbol}
                                    onClick={() => setSelectedToken(token)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedToken.symbol === token.symbol
                                            ? "bg-slate-800 text-white"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                >
                                    {token.symbol}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Display */}
                    <div className="px-5 py-4">
                        <div className="flex items-baseline gap-3 mb-1">
                            <span className="text-2xl font-bold text-slate-800">
                                ${currentPrice < 10 ? currentPrice.toFixed(4) : currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                                {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
                            </span>
                        </div>
                        <p className="text-sm text-slate-500">{selectedToken.name} / USD</p>
                    </div>

                    {/* Timeframe */}
                    <div className="px-5 pb-3 flex gap-1">
                        {timeframes.map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${timeframe === tf ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"
                                    }`}
                            >
                                {tf}
                            </button>
                        ))}
                        <button onClick={loadPriceData} className="ml-auto p-1.5 text-slate-400 hover:text-slate-600">
                            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                        </button>
                    </div>

                    {/* Chart */}
                    <div className="px-5 pb-4">
                        <div className="bg-slate-50 rounded-lg p-3">
                            {isLoading ? (
                                <div className="h-[200px] flex items-center justify-center">
                                    <RefreshCw size={24} className="text-slate-300 animate-spin" />
                                </div>
                            ) : (
                                <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                                    {/* Grid */}
                                    {[0, 1, 2, 3].map((i) => {
                                        const y = padding.top + (i / 3) * innerHeight;
                                        const price = maxPrice - (i / 3) * priceRange;
                                        return (
                                            <g key={i}>
                                                <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="2,2" />
                                                <text x={chartWidth - padding.right + 4} y={y + 3} className="text-[9px] fill-slate-400">
                                                    {price < 10 ? price.toFixed(2) : Math.round(price).toLocaleString()}
                                                </text>
                                            </g>
                                        );
                                    })}
                                    <defs>
                                        <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path d={areaPath} fill="url(#chartGrad)" />
                                    <path d={linePath} fill="none" stroke="#6366f1" strokeWidth={2} />
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="px-5 pb-4 grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-slate-500 uppercase">High</p>
                            <p className="text-sm font-semibold text-slate-700">${(currentPrice * 1.02).toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-slate-500 uppercase">Low</p>
                            <p className="text-sm font-semibold text-slate-700">${(currentPrice * 0.98).toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-slate-500 uppercase">Volume</p>
                            <p className="text-sm font-semibold text-slate-700">$1.2B</p>
                        </div>
                    </div>

                    {/* AI Analysis Section */}
                    <div className="px-5 pb-4">
                        <button
                            onClick={() => setShowAI(!showAI)}
                            className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Brain size={18} className="text-slate-600" />
                                <span className="font-medium text-slate-700">AI Analysis</span>
                            </div>
                            {showAI ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </button>

                        {showAI && (
                            <div className="mt-3 space-y-3">
                                {!analysis && !isAnalyzing && (
                                    <button
                                        onClick={runAnalysis}
                                        className="w-full py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Sparkles size={16} />
                                        Run AI Analysis
                                    </button>
                                )}

                                {isAnalyzing && (
                                    <div className="py-8 text-center">
                                        <Loader size={24} className="mx-auto text-slate-400 animate-spin mb-3" />
                                        <p className="text-sm text-slate-500">Analyzing {selectedToken.symbol}...</p>
                                    </div>
                                )}

                                {analysis && !isAnalyzing && (
                                    <div className="space-y-3">
                                        {/* Signal */}
                                        <div className={`p-4 rounded-lg border ${analysis.sentiment === "bullish" ? "bg-green-50 border-green-200" :
                                                analysis.sentiment === "bearish" ? "bg-red-50 border-red-200" :
                                                    "bg-slate-50 border-slate-200"
                                            }`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-sm font-semibold ${analysis.sentiment === "bullish" ? "text-green-700" :
                                                        analysis.sentiment === "bearish" ? "text-red-700" : "text-slate-700"
                                                    }`}>
                                                    {analysis.signal} Signal
                                                </span>
                                                <span className="text-xs text-slate-500">{analysis.confidence}% confidence</span>
                                            </div>
                                            <p className="text-sm text-slate-600">{analysis.reason}</p>
                                        </div>

                                        {/* Indicators */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-slate-50 rounded-lg p-2 text-center">
                                                <p className="text-[10px] text-slate-500">RSI</p>
                                                <p className="text-sm font-semibold text-slate-700">{analysis.rsi}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-2 text-center">
                                                <p className="text-[10px] text-slate-500">Support</p>
                                                <p className="text-sm font-semibold text-slate-700">${analysis.support.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-2 text-center">
                                                <p className="text-[10px] text-slate-500">Resistance</p>
                                                <p className="text-sm font-semibold text-slate-700">${analysis.resistance.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {/* Create Workflow */}
                                        <button
                                            onClick={createWorkflow}
                                            className="w-full py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Play size={16} />
                                            Create Trading Workflow
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
