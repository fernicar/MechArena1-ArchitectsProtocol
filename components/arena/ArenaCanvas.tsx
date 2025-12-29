
import React, { useRef, useEffect } from 'react';
import { BattleResult } from '../../types';
import { ARENA_SIZE } from '../../services/BattleEngine';
import { useBattleLoop } from './canvas/useBattleLoop';
import { renderBattleFrame } from './canvas/BattleRenderer';

interface ArenaCanvasProps {
    battleResult: BattleResult | null;
    currentFrameIdx: number;
    isPlaying: boolean;
    playbackSpeed: number;
    setCurrentFrameIdx: React.Dispatch<React.SetStateAction<number>>;
    setIsPlaying: (playing: boolean) => void;
    onFinish: () => void;
    isReplay: boolean;
}

const ArenaCanvas: React.FC<ArenaCanvasProps> = ({ 
    battleResult, currentFrameIdx, isPlaying, playbackSpeed, 
    setCurrentFrameIdx, setIsPlaying, onFinish, isReplay 
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const zoomRef = useRef<number>(1);
    
    const { visualEffectsRef, shakeOffset } = useBattleLoop(
        battleResult, 
        currentFrameIdx, 
        isPlaying, 
        playbackSpeed, 
        setCurrentFrameIdx, 
        setIsPlaying, 
        onFinish, 
        isReplay
    );

    // Canvas Drawing Effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !battleResult || !battleResult.frames[currentFrameIdx]) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const frame = battleResult.frames[currentFrameIdx];
        
        // Calculate Target Zoom based on distance between mechs
        const p1 = frame.player.position;
        const p2 = frame.enemy.position;
        const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        
        // Ideal zoom: close (100px) -> 1.2x, far (600px) -> 0.6x
        // 500 / (dist + 200) roughly maps 
        // Dist 0 -> 2.5 (Clamp to 1.3)
        // Dist 200 -> 1.25
        // Dist 600 -> 0.6
        const targetZoom = Math.max(0.6, Math.min(1.3, 500 / (distance + 200)));
        
        // Lerp zoom for smoothness
        zoomRef.current += (targetZoom - zoomRef.current) * 0.05;

        renderBattleFrame(
            ctx, 
            frame, 
            battleResult, 
            visualEffectsRef.current,
            { width: canvas.width, height: canvas.height },
            { zoom: zoomRef.current, shake: shakeOffset.current }
        );

    }, [currentFrameIdx, battleResult, visualEffectsRef, shakeOffset]);

    return (
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
             <div className="relative" style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: `${ARENA_SIZE.width}/${ARENA_SIZE.height}` }}>
                <canvas 
                    ref={canvasRef}
                    width={ARENA_SIZE.width} 
                    height={ARENA_SIZE.height}
                    className="bg-black shadow-2xl border border-slate-700 w-full h-full"
                />
             </div>
        </div>
    );
};

export default ArenaCanvas;
