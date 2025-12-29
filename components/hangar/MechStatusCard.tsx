
import React from 'react';
import { MechBuild } from '../../types';
import MechPreviewSVG from '../garage/MechPreviewSVG';

interface MechStatusCardProps {
    mech: MechBuild;
    isMechValid: boolean;
    validationErrors: string[];
    onNavigateGarage: () => void;
}

const MechStatusCard: React.FC<MechStatusCardProps> = ({ mech, isMechValid, validationErrors, onNavigateGarage }) => {
    return (
        <div className={`flex-1 bg-slate-900/80 border-t-2 p-6 relative group overflow-hidden flex flex-col justify-between min-h-[300px] transition-colors ${isMechValid ? 'border-cyan-500' : 'border-red-500 bg-red-900/10'}`}>
            
            {/* Mech Visualization or SVG */}
            <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity z-0 flex items-center justify-center pointer-events-none">
                {mech.imageUrl ? (
                    <img src={mech.imageUrl} alt="Mech" className="w-full h-full object-cover mix-blend-screen" />
                ) : (
                    <div className="w-full h-full p-8 opacity-20">
                        <MechPreviewSVG build={mech} />
                    </div>
                )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-0"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start">
                     <div>
                        <h3 className="text-slate-400 text-sm uppercase tracking-widest mb-1">Active Unit</h3>
                        <h2 className="text-3xl font-bold text-white mb-2">{mech.name}</h2>
                     </div>
                     <span className={`text-xs font-mono border px-1 ${isMechValid ? 'text-cyan-500 border-cyan-500' : 'text-red-500 border-red-500 animate-pulse'}`}>
                        {isMechValid ? 'ACTIVE' : 'ERROR'}
                     </span>
                </div>
                
                <div className="space-y-4 font-mono text-sm mt-4 bg-slate-900/60 p-4 rounded backdrop-blur-sm">
                    <div className="flex justify-between border-b border-slate-700 pb-1">
                        <span className="text-slate-500">AP STATUS</span>
                        <span className="text-green-400">{mech.stats.ap} / {mech.stats.ap}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700 pb-1">
                        <span className="text-slate-500">WEIGHT LOAD</span>
                        <span className={mech.stats.weight > mech.stats.weightCapacity ? "text-red-500 font-bold blink" : "text-slate-300"}>
                            {Math.round((mech.stats.weight / mech.stats.weightCapacity) * 100)}%
                        </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700 pb-1">
                        <span className="text-slate-500">EN OUTPUT</span>
                        <span className={mech.stats.energyDrain > mech.stats.energyOutput ? "text-red-500 font-bold blink" : "text-slate-300"}>
                            {Math.round((mech.stats.energyDrain / mech.stats.energyOutput) * 100)}%
                        </span>
                    </div>
                </div>

                {!isMechValid && (
                    <div className="mt-6 p-2 bg-red-900/20 border border-red-500/50 backdrop-blur-sm relative z-10">
                        <div className="text-[10px] text-red-400 font-bold uppercase mb-1">System Alerts:</div>
                        {validationErrors.map((err, i) => (
                            <div key={i} className="text-[10px] text-red-500 font-mono">> {err}</div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-8 relative z-10">
                <button 
                    onClick={onNavigateGarage}
                    className={`w-full py-3 border font-bold uppercase tracking-widest transition-all
                        ${isMechValid 
                            ? 'bg-cyan-900/80 border-cyan-500/50 hover:bg-cyan-500 hover:text-black text-cyan-400' 
                            : 'bg-red-900/80 border-red-500/50 hover:bg-red-500 hover:text-white text-red-400 animate-pulse'}`}
                >
                    {isMechValid ? 'Enter Garage' : 'FIX CONFIGURATION'}
                </button>
            </div>
        </div>
    );
};

export default MechStatusCard;
