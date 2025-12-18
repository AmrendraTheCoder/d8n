import React, { useState, useEffect } from "react";
import { X, Settings, Save } from "lucide-react";

const DEFAULT_SETTINGS = {
    chainId: 240,
    apiUrl: "http://localhost:3000",
    nexusBackendUrl: "http://localhost:3001",
    mockProviderUrl: "http://localhost:4000",
    autoUseConnectedWallet: true,
};

export default function GlobalSettingsModal({ isOpen, onClose }) {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem("d8n-nexus-settings");
        if (savedSettings) {
            try {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
            } catch (e) {
                console.error("Failed to parse saved settings:", e);
            }
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        setSaved(false);
    };

    const handleSave = () => {
        localStorage.setItem("d8n-nexus-settings", JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS);
        localStorage.removeItem("d8n-nexus-settings");
        setSaved(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Settings className="text-white" size={24} />
                        <h2 className="text-xl font-bold text-white">Global Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Network Settings */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                            Network Configuration
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="chainId" className="block text-sm font-medium text-slate-700 mb-1">
                                    Default Chain
                                </label>
                                <select
                                    id="chainId"
                                    name="chainId"
                                    value={settings.chainId}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                >
                                    <option value={240}>Cronos zkEVM Testnet (240)</option>
                                    <option value={388}>Cronos zkEVM Mainnet (388)</option>
                                    <option value={25}>Cronos Mainnet (25)</option>
                                    <option value={338}>Cronos Testnet (338)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* API Endpoints */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                            API Endpoints
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="apiUrl" className="block text-sm font-medium text-slate-700 mb-1">
                                    D8N Engine URL
                                </label>
                                <input
                                    id="apiUrl"
                                    name="apiUrl"
                                    type="text"
                                    value={settings.apiUrl}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="http://localhost:3000"
                                />
                            </div>
                            <div>
                                <label htmlFor="nexusBackendUrl" className="block text-sm font-medium text-slate-700 mb-1">
                                    Nexus Backend URL
                                </label>
                                <input
                                    id="nexusBackendUrl"
                                    name="nexusBackendUrl"
                                    type="text"
                                    value={settings.nexusBackendUrl}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="http://localhost:3001"
                                />
                            </div>
                            <div>
                                <label htmlFor="mockProviderUrl" className="block text-sm font-medium text-slate-700 mb-1">
                                    Mock Provider URL
                                </label>
                                <input
                                    id="mockProviderUrl"
                                    name="mockProviderUrl"
                                    type="text"
                                    value={settings.mockProviderUrl}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="http://localhost:4000"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                            Preferences
                        </h3>
                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                            <input
                                type="checkbox"
                                name="autoUseConnectedWallet"
                                checked={settings.autoUseConnectedWallet}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">
                                Auto-use connected wallet for transactions
                            </span>
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                    <button
                        onClick={handleReset}
                        className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Reset to Defaults
                    </button>
                    <div className="flex items-center gap-3">
                        {saved && (
                            <span className="text-sm text-green-600 font-medium">✓ Saved!</span>
                        )}
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
                        >
                            <Save size={18} />
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Hook to access settings from other components
export function useGlobalSettings() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);

    useEffect(() => {
        const loadSettings = () => {
            const savedSettings = localStorage.getItem("d8n-nexus-settings");
            if (savedSettings) {
                try {
                    setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
                } catch (e) {
                    console.error("Failed to parse saved settings:", e);
                }
            }
        };

        loadSettings();
        // Listen for storage changes
        window.addEventListener("storage", loadSettings);
        return () => window.removeEventListener("storage", loadSettings);
    }, []);

    return settings;
}
