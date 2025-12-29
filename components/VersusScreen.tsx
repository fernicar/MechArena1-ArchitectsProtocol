
import React, { useEffect, useState } from 'react';
import { MechBuild, EnemyProfile } from '../types';
import MechPreviewSVG from './garage/MechPreviewSVG';
import { playSound } from '../services/audioService';

interface VersusScreenProps {
    playerBuild: MechBuild;
    enemyProfile: EnemyProfile;
    onReady: () => void;
}

const VersusScreen: React.FC<VersusScreenProps> = ({ playerBuild, enemyProfile, onReady }) => {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState<'INIT' | 'STATS' | 'READY'>('INIT');

    useEffect(() => {
        playSound('UI_CLICK'); // Initial sound
        
        // Timeline
        const t1 = setTimeout(() => {
            setPhase('STATS');
            playSound('UI_HOVER');
        }, 1000);

        const t2 = setTimeout(() => {
            setPhase('READY');
            playSound('UI_HOVER');
        }, 3000);

        const t3 = setTimeout(() => {
            onReady();
        }, 4500);

        // Progress bar simulation
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 100;
                return prev + (Math.random() * 5);
            });
        }, 100);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearInterval(interval);
        };
    }, [onReady]);

    const StatRow = ({ label, pVal, eVal, max }: { label: string, pVal: number, eVal: number, max: number }) => {
        const pPct = (pVal / max) * 100;
        const ePct = (eVal / max) * 100;
        
        return (
            <div className="flex items-center gap-4 text-[10px] sm:text-xs font-mono mb-2">
                <div className="flex-1 flex justify-end items-center gap-2">
                    <span className="text-white">{pVal}</span>
                    <div className="w-24 h-2 bg-slate-800 skew-x-[-15deg] overflow-hidden">
                        <div className="h-full bg-cyan-500" style={{ width: `${pPct}%`, marginLeft: `${100 - pPct}%` }}></div>
                    </div>
                </div>
                <div className="w-16 text-center text-slate-500 font-bold">{label}</div>
                <div className="flex-1 flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-800 skew-x-[-15deg] overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: `${ePct}%` }}></div>
                    </div>
                    <span className="text-white">{eVal}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-black overflow-hidden flex flex-col pointer-events-none">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black opacity-80"></div>
            
            {/* VS Slash */}
            <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-slate-800 -skew-x-[20deg] origin-bottom z-0"></div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-1 h-full">
                
                {/* Left Side: Player */}
                <div className={`flex-1 relative transition-all duration-700 ease-out transform ${phase === 'INIT' ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 to-transparent"></div>
                    <div className="h-full flex flex-col justify-center items-end pr-12 pb-20">
                        {/* Mech Visual */}
                        <div className="w-[80%] h-[60%] relative mb-8">
                            <MechPreviewSVG build={playerBuild} />
                        </div>
                        
                        <div className="text-right">
                            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter shadow-cyan-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                                {playerBuild.name}
                            </h2>
                            <div className="text-cyan-400 font-mono text-xl tracking-widest uppercase">
                                PLAYER UNIT
                            </div>
                            <div className="mt-2 text-slate-400 text-xs font-mono">
                                AP: {playerBuild.stats.ap} // WGT: {playerBuild.stats.weight}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Enemy */}
                <div className={`flex-1 relative transition-all duration-700 ease-out delay-100 transform ${phase === 'INIT' ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
                    <div className="absolute inset-0 bg-gradient-to-l from-red-900/20 to-transparent"></div>
                    <div className="h-full flex flex-col justify-center items-start pl-12 pb-20">
                        {/* Mech Visual */}
                        <div className="w-[80%] h-[60%] relative mb-8">
                            <MechPreviewSVG build={enemyProfile.build} />
                        </div>

                        <div className="text-left">
                            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                {enemyProfile.name}
                            </h2>
                            <div className="text-red-500 font-mono text-xl tracking-widest uppercase">
                                {enemyProfile.difficulty} TARGET
                            </div>
                            <div className="mt-2 text-slate-400 text-xs font-mono">
                                RANK: {enemyProfile.rating} // {enemyProfile.description}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center VS Overlay */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-500 ${phase === 'INIT' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
                    <h1 className="text-[120px] font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] animate-pulse">
                        VS
                    </h1>
                </div>
            </div>

            {/* Stats Overlay */}
            {phase === 'STATS' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-20 w-full max-w-2xl bg-black/80 border-y border-slate-700 p-4 backdrop-blur-sm animate-fade-in z-30">
                    <StatRow label="ARMOR" pVal={playerBuild.stats.ap} eVal={enemyProfile.build.stats.ap} max={15000} />
                    <StatRow label="FIREPOWER" pVal={playerBuild.stats.firepower} eVal={enemyProfile.build.stats.firepower} max={5000} />
                    <StatRow label="MOBILITY" pVal={playerBuild.stats.mobility} eVal={enemyProfile.build.stats.mobility} max={1200} />
                </div>
            )}

            {/* Bottom Bar */}
            <div className="absolute bottom-0 left-0 w-full h-16 bg-slate-900 border-t border-slate-700 flex items-center px-8 justify-between z-30">
                <div className="text-xs text-slate-500 font-mono uppercase animate-pulse">
                    {phase === 'READY' ? 'SYSTEM LINK ESTABLISHED' : 'SYNCHRONIZING BATTLE DATA...'}
                </div>
                
                <div className="w-1/3 flex flex-col gap-1">
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[8px] text-cyan-500 font-mono">
                        <span>NET_OK</span>
                        <span>{Math.floor(progress)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VersusScreen;
