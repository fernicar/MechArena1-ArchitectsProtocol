
import React from 'react';

interface HangarActionsProps {
    isMechValid: boolean;
    onSortie: (view: 'ARENA' | 'TOURNAMENT') => void;
}

const HangarActions: React.FC<HangarActionsProps> = ({ isMechValid, onSortie }) => {
    return (
        <div className="flex-1 flex flex-col md:flex-row gap-4">
            {/* Tournament (Main Action) */}
            <button 
                onClick={() => onSortie('TOURNAMENT')}
                className={`flex-1 bg-gradient-to-r from-yellow-900/40 to-slate-900/80 border-l-4 border-yellow-500 p-8 text-left relative group overflow-hidden transition-all min-h-[200px]
                    ${isMechValid ? 'hover:bg-yellow-900/50' : 'opacity-50 grayscale cursor-not-allowed'}`}
            >
                <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-48 h-48 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z"/></svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors uppercase italic">Ranked Tournament</h2>
                <p className="text-yellow-200/60 max-w-sm mb-4">Official league matches. Simulated combat against ranked opponents.</p>
                <span className="inline-block bg-yellow-500 text-black font-bold px-3 py-1 text-xs uppercase">Enter Network</span>
                
                {!isMechValid && (
                    <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center">
                        <div className="border-2 border-red-500 bg-black text-red-500 px-4 py-2 font-bold uppercase -rotate-6 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                            SORTIE LOCKED
                        </div>
                    </div>
                )}
            </button>

            {/* Arena (Test) */}
            <button 
                onClick={() => onSortie('ARENA')}
                className={`flex-1 bg-gradient-to-r from-red-900/40 to-slate-900/80 border-l-4 border-red-500 p-8 text-left relative group overflow-hidden transition-all min-h-[200px]
                    ${isMechValid ? 'hover:bg-red-900/50' : 'opacity-50 grayscale cursor-not-allowed'}`}
            >
                <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-48 h-48 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-2h2v2zm0-4H7v-2h2v2zm0-4H7V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors uppercase italic">Test Arena</h2>
                <p className="text-red-200/60 max-w-sm mb-4">Simulation battles against target dummies and standard ACs.</p>
                <span className="inline-block bg-red-600 text-white font-bold px-3 py-1 text-xs uppercase">Run Simulation</span>

                    {!isMechValid && (
                    <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center">
                        <div className="border-2 border-red-500 bg-black text-red-500 px-4 py-2 font-bold uppercase rotate-6 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                            SYSTEM ERROR
                        </div>
                    </div>
                )}
            </button>
        </div>
    );
};

export default HangarActions;
