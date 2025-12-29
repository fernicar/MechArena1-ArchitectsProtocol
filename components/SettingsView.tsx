
import React, { useState } from 'react';
import { useGameStore } from '../store';
import { setMasterVolume, getMasterVolume } from '../services/audioService';
import ConfirmationModal from './common/ConfirmationModal';

interface SettingsViewProps {
    onExit: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onExit }) => {
    const { debugSettings, setDebugSettings } = useGameStore();
    const [volume, setVolume] = useState(getMasterVolume() * 100);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const handleVolumeChange = (val: number) => {
        setVolume(val);
        setMasterVolume(val / 100);
    };

    const confirmReset = async () => {
        // Logic to clear data
        localStorage.clear();
        
        // Delete IndexedDB
        const req = indexedDB.deleteDatabase('CoreArchitectDB');
        req.onsuccess = () => window.location.reload();
        req.onerror = () => {
            console.error("Failed to delete DB");
            window.location.reload(); // Reload anyway
        };
    };

    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <ConfirmationModal 
                isOpen={showResetConfirm}
                title="FACTORY RESET"
                message="Wipe all game progress? All mechs, parts, and rankings will be lost forever."
                confirmLabel="INITIATE WIPE"
                onConfirm={confirmReset}
                onCancel={() => setShowResetConfirm(false)}
            />

            <div className="bg-slate-900 border border-slate-600 w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950">
                    <h1 className="text-xl font-bold text-white uppercase tracking-widest glow-text">System Settings</h1>
                    <button 
                        onClick={onExit}
                        className="text-slate-400 hover:text-white transition-colors p-1"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                    
                    {/* Audio Settings */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-sm">
                        <h3 className="text-slate-400 text-xs font-bold uppercase mb-4 border-b border-slate-800 pb-2">Audio</h3>
                        <div className="flex items-center gap-4">
                            <span className="text-slate-400 text-xs uppercase w-16">Master Vol</span>
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={volume}
                                onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                            <span className="text-white font-mono text-sm w-8 text-right">{volume}%</span>
                        </div>
                    </div>

                    {/* Debug Configuration */}
                    <div className={`bg-slate-950 border p-4 rounded-sm transition-colors ${debugSettings.enabled ? 'border-cyan-900/50' : 'border-slate-800'}`}>
                        <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                            <h3 className={`font-bold text-xs uppercase ${debugSettings.enabled ? 'text-cyan-400' : 'text-slate-500'}`}>Debug Configuration</h3>
                            {/* Master Toggle moved here */}
                            <input 
                                type="checkbox"
                                checked={debugSettings.enabled}
                                onChange={(e) => setDebugSettings({ enabled: e.target.checked })}
                                className="w-4 h-4 accent-cyan-500 cursor-pointer"
                                title="Enable Master Debug Mode"
                            />
                        </div>
                        
                        <div className={`space-y-3 transition-all duration-200 ${!debugSettings.enabled ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-xs">Unlock All Parts</span>
                                <input 
                                    type="checkbox"
                                    checked={debugSettings.unlockAllParts}
                                    onChange={(e) => setDebugSettings({ unlockAllParts: e.target.checked })}
                                    className="w-4 h-4 accent-cyan-500"
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-xs">Unlock All Chips</span>
                                <input 
                                    type="checkbox"
                                    checked={debugSettings.unlockAllChips}
                                    onChange={(e) => setDebugSettings({ unlockAllChips: e.target.checked })}
                                    className="w-4 h-4 accent-cyan-500"
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-xs">Unlock AI Tree</span>
                                <input 
                                    type="checkbox"
                                    checked={debugSettings.unlockTree}
                                    onChange={(e) => setDebugSettings({ unlockTree: e.target.checked })}
                                    className="w-4 h-4 accent-cyan-500"
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-xs">Instant Level Up (On Win)</span>
                                <input 
                                    type="checkbox"
                                    checked={debugSettings.instantLevelUp}
                                    onChange={(e) => setDebugSettings({ instantLevelUp: e.target.checked })}
                                    className="w-4 h-4 accent-cyan-500"
                                />
                            </div>
                            <div className="mt-2 text-[9px] text-slate-500 italic border-t border-slate-800 pt-2">
                                * Enabling debug mode bypasses API requirements and unlocks progression features for testing.
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <button 
                        onClick={() => setShowResetConfirm(true)}
                        className="w-full py-3 bg-red-900/10 border border-red-900/30 text-red-500 hover:bg-red-900/30 hover:text-red-400 hover:border-red-500 font-bold uppercase text-xs tracking-wider transition-all"
                    >
                        Factory Reset (Clear Save Data)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
