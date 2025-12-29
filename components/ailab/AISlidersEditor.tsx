import React from 'react';
import { AISliders, MechBuild } from '../../types';

interface AISlidersEditorProps {
    build: MechBuild;
    onChange: (key: keyof AISliders, value: number) => void;
}

const AISlidersEditor: React.FC<AISlidersEditorProps> = ({ build, onChange }) => {
    // Configuration for the Radar Chart
    // Angles for a regular pentagon starting at -90 degrees (top)
    const stats: { key: keyof AISliders; label: string; angle: number }[] = [
        { key: 'aggression', label: 'AGGRESSION', angle: -90 },
        { key: 'caution', label: 'CAUTION', angle: -18 },
        { key: 'mobility', label: 'MOBILITY', angle: 54 },
        { key: 'focus', label: 'FOCUS', angle: 126 },
        { key: 'energySave', label: 'ENERGY', angle: 198 },
    ];

    const center = 50;
    const maxRadius = 35; // Leave room for labels

    const getPoint = (value: number, angle: number) => {
        const radians = (angle * Math.PI) / 180;
        const x = center + (value / 100) * maxRadius * Math.cos(radians);
        const y = center + (value / 100) * maxRadius * Math.sin(radians);
        return `${x},${y}`;
    };

    const getPolygonPoints = (values: AISliders) => {
        return stats.map(stat => getPoint(values[stat.key], stat.angle)).join(' ');
    };

    const getGridPolygon = (percent: number) => {
        return stats.map(stat => getPoint(percent, stat.angle)).join(' ');
    };

    return (
        <div className="flex flex-col lg:flex-row flex-1 gap-4 lg:gap-12 overflow-hidden h-full">
             <div className="w-full lg:w-1/2 overflow-y-auto pr-0 lg:pr-4">
                 <div className="bg-slate-900/50 p-6 border border-slate-700 rounded-sm">
                     <h2 className="text-white font-bold mb-6 uppercase border-l-4 border-cyan-500 pl-3">Base Personality Matrix</h2>
                     {(Object.entries(build.aiConfig.sliders) as [string, number][]).map(([key, value]) => (
                         <div key={key} className="mb-6">
                             <div className="flex justify-between items-end mb-2">
                                 <label className="text-cyan-400 font-bold tracking-widest uppercase">{key}</label>
                                 <span className="font-mono text-white">{value}</span>
                             </div>
                             <input 
                                 type="range" 
                                 min="0" 
                                 max="100" 
                                 value={value} 
                                 onChange={(e) => onChange(key as keyof AISliders, parseInt(e.target.value))}
                                 className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                             />
                         </div>
                     ))}
                 </div>
             </div>
             <div className="w-full lg:w-1/2 flex items-center justify-center bg-black border border-slate-800 relative min-h-[300px]">
                 <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-black"></div>
                 
                 <svg viewBox="0 0 100 100" className="w-full h-full max-w-[500px] overflow-visible p-8">
                     {/* Background Grid */}
                     {[20, 40, 60, 80, 100].map((percent) => (
                         <polygon 
                            key={percent}
                            points={getGridPolygon(percent)} 
                            fill="none" 
                            stroke="#334155" 
                            strokeWidth="0.5" 
                            strokeDasharray={percent === 100 ? "0" : "2,2"}
                         />
                     ))}

                     {/* Axis Lines */}
                     {stats.map(stat => (
                         <line 
                            key={stat.key}
                            x1={center} y1={center}
                            x2={center + (maxRadius * Math.cos(stat.angle * Math.PI / 180))}
                            y2={center + (maxRadius * Math.sin(stat.angle * Math.PI / 180))}
                            stroke="#334155"
                            strokeWidth="0.5"
                         />
                     ))}

                     {/* Data Polygon */}
                     <polygon 
                         points={getPolygonPoints(build.aiConfig.sliders)}
                         fill="rgba(6, 182, 212, 0.4)" 
                         stroke="#22d3ee" 
                         strokeWidth="2"
                         className="transition-all duration-300 ease-out"
                         filter="url(#glow)"
                     />
                     
                     {/* Vertices Dots */}
                     {stats.map(stat => {
                         const val = build.aiConfig.sliders[stat.key];
                         const pt = getPoint(val, stat.angle).split(',');
                         return (
                             <circle 
                                key={stat.key}
                                cx={pt[0]} cy={pt[1]} r="1.5" 
                                fill="#22d3ee"
                                className="transition-all duration-300 ease-out"
                             />
                         );
                     })}

                     {/* Labels */}
                     {stats.map(stat => {
                         const rad = stat.angle * Math.PI / 180;
                         const labelRadius = maxRadius + 8;
                         const x = center + labelRadius * Math.cos(rad);
                         const y = center + labelRadius * Math.sin(rad);
                         
                         return (
                             <text 
                                key={stat.key}
                                x={x} y={y}
                                fill="#94a3b8"
                                fontSize="4"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontWeight="bold"
                             >
                                 {stat.label}
                             </text>
                         );
                     })}

                     <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                     </defs>
                 </svg>
             </div>
        </div>
    );
};

export default AISlidersEditor;