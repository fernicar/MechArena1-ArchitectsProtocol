
import React, { useRef, useEffect } from 'react';
import { BattleResult } from '../../types';

interface BattleTelemetryProps {
    battleResult: BattleResult;
    currentFrameIdx: number;
    onSeek: (frame: number) => void;
}

const BattleTelemetry: React.FC<BattleTelemetryProps> = ({ battleResult, currentFrameIdx, onSeek }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !battleResult) return;

        // Resize handling
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const frames = battleResult.frames;
        const totalFrames = frames.length;
        
        // Layout Config
        const padding = 20;
        const graphHeight = (height - padding * 2) / 4;
        const graphWidth = width - padding * 2;

        // Clear
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#0f172a'; // Slate 900
        ctx.fillRect(0, 0, width, height);

        // Helper to map frame index to X
        const getX = (i: number) => padding + (i / Math.max(1, totalFrames - 1)) * graphWidth;

        // Draw Graph Function
        const drawGraph = (
            yOffset: number, 
            label: string, 
            getData: (state: any) => number, 
            getMax: (state: any) => number, 
            colorP: string, 
            colorE: string
        ) => {
            // Background
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(padding, yOffset, graphWidth, graphHeight - 5);
            
            // Label
            ctx.fillStyle = '#64748b';
            ctx.font = '10px monospace';
            ctx.fillText(label, padding, yOffset - 4);

            // Draw Lines
            // selector: Function to extract the specific mech state (player or enemy) from the frame
            const drawLine = (color: string, selector: (f: any) => any) => {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                
                // Optimization: Skip frames for performance if too long
                const step = Math.max(1, Math.floor(totalFrames / graphWidth)); 

                for (let i = 0; i < totalFrames; i += step) {
                    const f = frames[i];
                    const mechState = selector(f);
                    
                    if (!mechState) continue;

                    const val = getData(mechState);
                    const max = getMax(mechState) || 1; // Prevent division by zero
                    
                    // Invert Y because canvas Y grows downwards
                    const y = yOffset + (graphHeight - 5) - ((val / max) * (graphHeight - 5));
                    
                    if (i === 0) ctx.moveTo(getX(i), y);
                    else ctx.lineTo(getX(i), y);
                }
                ctx.stroke();
            };

            drawLine(colorE, (f) => f.enemy);
            drawLine(colorP, (f) => f.player);
        };

        // 1. AP (HP)
        drawGraph(
            padding + 10, 
            "ARMOR INTEGRITY", 
            (state) => state.hp, 
            (state) => state.maxHp, 
            '#22d3ee', // Player Cyan
            '#ef4444'  // Enemy Red
        );

        // 2. ENERGY
        drawGraph(
            padding + 10 + graphHeight, 
            "GENERATOR OUTPUT", 
            (state) => state.energy, 
            (state) => state.maxEnergy, 
            '#22d3ee', 
            '#ef4444'
        );

        // 3. HEAT
        drawGraph(
            padding + 10 + graphHeight * 2, 
            "CORE TEMPERATURE", 
            (state) => state.heat, 
            (state) => state.maxHeat, 
            '#f97316', // Orange
            '#f97316'
        );

        // 4. STABILITY
        drawGraph(
            padding + 10 + graphHeight * 3, 
            "ATTITUDE STABILITY (ACS)", 
            (state) => state.stability, 
            (state) => state.maxStability, 
            '#eab308', // Yellow
            '#eab308'
        );

        // Current Time Cursor
        const cursorX = getX(currentFrameIdx);
        ctx.beginPath();
        ctx.moveTo(cursorX, padding);
        ctx.lineTo(cursorX, height - padding);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

    }, [battleResult, currentFrameIdx]);

    const handleClick = (e: React.MouseEvent) => {
        if (!containerRef.current || !battleResult) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - 20; // minus padding
        const width = rect.width - 40;
        
        const pct = Math.max(0, Math.min(1, x / width));
        const frame = Math.floor(pct * battleResult.frames.length);
        onSeek(frame);
    };

    return (
        <div ref={containerRef} className="w-full h-full relative cursor-crosshair" onClick={handleClick}>
            <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
    );
};

export default BattleTelemetry;
