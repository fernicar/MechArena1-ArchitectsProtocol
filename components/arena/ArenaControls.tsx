
import React, { useEffect } from 'react';
import { BattleResult } from '../../types';
import { playSound } from '../../services/audioService';

interface ArenaControlsProps {
    currentFrameIdx: number;
    totalFrames: number;
    isPlaying: boolean;
    playbackSpeed: number;
    battleResult: BattleResult | null;
    isReplay: boolean;
    showTelemetry: boolean;
    onSeek: (frame: number) => void;
    onPlayPause: () => void;
    onRestart: () => void;
    onSpeedChange: (speed: number) => void;
    onToggleTelemetry: () => void;
    onEnd: () => void;
}

const ArenaControls: React.FC<ArenaControlsProps> = ({ 
    currentFrameIdx, totalFrames, isPlaying, playbackSpeed, battleResult, isReplay, showTelemetry,
    onSeek, onPlayPause, onRestart, onSpeedChange, onToggleTelemetry, onEnd 
}) => {

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                onPlayPause();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (isPlaying) onPlayPause();
                const next = Math.min(totalFrames - 1, currentFrameIdx + 1);
                onSeek(next);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (isPlaying) onPlayPause();
                const prev = Math.max(0, currentFrameIdx - 1);
                onSeek(prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentFrameIdx, totalFrames, isPlaying, onPlayPause, onSeek]);

    return (
        <div className="bg-slate-900 border-t border-slate-700 p-4 flex flex-col gap-2 z-20">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mb-1">
                <span>FRAME: {currentFrameIdx} / {totalFrames}</span>
                <div className="flex-1 h-2 bg-slate-700 rounded-lg relative">
                     <div 
                        className="absolute top-0 left-0 h-full bg-cyan-600 rounded-lg pointer-events-none" 
                        style={{ width: `${(currentFrameIdx / totalFrames) * 100}%` }}
                     ></div>
                     <input 
                        type="range" 
                        min="0" 
                        max={totalFrames - 1} 
                        value={currentFrameIdx}
                        onChange={(e) => {
                            onSeek(parseInt(e.target.value));
                        }}
                        className="w-full h-full opacity-0 cursor-pointer absolute top-0 left-0"
                    />
                </div>
            </div>
            
            <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex gap-2 items-center">
                    <button onClick={onPlayPause} className="px-4 py-1 bg-cyan-700 text-white rounded font-mono uppercase text-sm w-20 text-center">
                        {isPlaying ? 'PAUSE' : 'PLAY'}
                    </button>
                    
                    <div className="flex bg-slate-800 rounded border border-slate-600">
                        <button 
                            onClick={() => {
                                if (isPlaying) onPlayPause();
                                onSeek(Math.max(0, currentFrameIdx - 1));
                            }}
                            className="px-3 py-1 hover:bg-slate-700 text-slate-300 border-r border-slate-600"
                            title="Step Back (Left Arrow)"
                        >
                            ◀
                        </button>
                        <button 
                            onClick={() => {
                                if (isPlaying) onPlayPause();
                                onSeek(Math.min(totalFrames - 1, currentFrameIdx + 1));
                            }}
                            className="px-3 py-1 hover:bg-slate-700 text-slate-300"
                            title="Step Forward (Right Arrow)"
                        >
                            ▶
                        </button>
                    </div>

                    <button onClick={onRestart} className="px-3 py-1 bg-slate-700 text-white rounded font-mono uppercase text-sm hover:bg-slate-600">
                        ↺
                    </button>

                    <select value={playbackSpeed} onChange={(e) => onSpeedChange(parseFloat(e.target.value))} className="bg-slate-800 text-slate-300 text-sm border border-slate-600 rounded px-2 py-1">
                        <option value="0.1">0.1x</option>
                        <option value="0.5">0.5x</option>
                        <option value="1">1.0x</option>
                        <option value="2">2.0x</option>
                        <option value="4">4.0x</option>
                    </select>
                    
                    <button 
                        onClick={onToggleTelemetry}
                        className={`px-3 py-1 rounded font-mono uppercase text-sm border transition-all flex items-center gap-1
                            ${showTelemetry 
                                ? 'bg-indigo-900 border-indigo-500 text-indigo-300' 
                                : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white'}
                        `}
                        title="Toggle Telemetry Analysis"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        <span className="hidden sm:inline">DATA</span>
                    </button>
                </div>

                <div className="flex gap-4 items-center animate-fade-in ml-auto">
                    {battleResult && (
                        <div className="text-sm md:text-xl font-bold uppercase hidden lg:block">RESULT: <span className={battleResult?.winner === 'PLAYER' ? 'text-green-500' : 'text-red-500'}>{battleResult?.winner === 'PLAYER' ? 'VICTORY' : 'DEFEAT'}</span></div>
                    )}
                    <button onClick={onEnd} className="px-6 py-2 bg-white text-black font-bold uppercase hover:bg-slate-200 text-xs md:text-sm">
                        {isReplay ? 'EXIT REPLAY' : 'CONFIRM'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArenaControls;
