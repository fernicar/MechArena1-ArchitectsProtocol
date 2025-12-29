
import React, { useState, useRef } from 'react';
import { MechBuild, BehaviorNodeType, BehaviorNode } from '../../types';

interface AITreeEditorProps {
    build: MechBuild;
    onUpdate: (nodes: BehaviorNode[]) => void;
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 64;

const AITreeEditor: React.FC<AITreeEditorProps> = ({ build, onUpdate }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [connectionStart, setConnectionStart] = useState<string | null>(null);
    const [linkMode, setLinkMode] = useState(false); // For mobile/touch

    const handleMoveNode = (id: string, dx: number, dy: number) => {
        const nodes = build.aiConfig.treeNodes.map(n => {
            if (n.id === id) {
                return { ...n, x: n.x + dx, y: n.y + dy };
            }
            return n;
        });
        onUpdate(nodes);
    };

    const addNode = (type: BehaviorNodeType) => {
        const id = `node_${Date.now()}`;
        const newNode: BehaviorNode = {
            id,
            type,
            label: type,
            x: 100,
            y: 100,
            children: [],
            config: {}
        };
        
        // Default configs
        if (type === 'CONDITION') {
            newNode.config = { condition: 'range_less', param: '300' };
            newNode.label = "Range < 300";
        } else if (type === 'ACTION') {
            newNode.config = { action: 'attack_right' };
            newNode.label = "Attack (R)";
        }

        onUpdate([...build.aiConfig.treeNodes, newNode]);
    };

    const deleteNode = (id: string) => {
        const nodes = build.aiConfig.treeNodes
          .filter(n => n.id !== id)
          .map(n => ({ ...n, children: n.children.filter(childId => childId !== id) }));
        
        onUpdate(nodes);
        if (selectedNodeId === id) setSelectedNodeId(null);
    };

    const toggleConnection = (parentId: string, childId: string) => {
        if (parentId === childId) return;
        
        const nodes = [...build.aiConfig.treeNodes];
        const parent = nodes.find(n => n.id === parentId);
        
        if (parent) {
            if (parent.children.includes(childId)) {
                // Disconnect
                parent.children = parent.children.filter(id => id !== childId);
            } else {
                // Connect
                parent.children.push(childId);
            }
            onUpdate(nodes);
        }
    };

    const updateNodeConfig = (id: string, updates: Partial<BehaviorNode['config']>, newLabel?: string) => {
        const nodes = build.aiConfig.treeNodes.map(n => {
            if (n.id === id) {
                return { ...n, config: { ...n.config, ...updates }, label: newLabel || n.label };
            }
            return n;
        });
        onUpdate(nodes);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingId && !linkMode) {
            handleMoveNode(draggingId, e.movementX, e.movementY);
        }
    };

    // Calculate Bezier path
    const getPath = (x1: number, y1: number, x2: number, y2: number) => {
        // Curve control points
        const c1x = x1;
        const c1y = y1 + 50;
        const c2x = x2;
        const c2y = y2 - 50;
        return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
    };

    return (
        <div className="flex h-full border border-slate-700 relative">
            {/* Sidebar */}
            <div className="w-48 bg-slate-900 border-r border-slate-700 p-2 flex flex-col gap-2 z-10 absolute lg:static bottom-0 left-0 top-0 overflow-y-auto">
                <div className="text-xs text-slate-400 uppercase font-bold mb-2">Node Palette</div>
                {(['SELECTOR', 'SEQUENCE', 'CONDITION', 'ACTION'] as BehaviorNodeType[]).map(type => (
                    <button 
                        key={type}
                        onClick={() => addNode(type)}
                        className={`p-2 text-xs border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white uppercase
                            ${type === 'CONDITION' ? 'border-l-4 border-l-yellow-500' : 
                              type === 'ACTION' ? 'border-l-4 border-l-red-500' : 
                              'border-l-4 border-l-cyan-500'}`}
                    >
                        + {type}
                    </button>
                ))}
                
                <div className="mt-4 border-t border-slate-700 pt-4">
                    <button 
                        onClick={() => { setLinkMode(!linkMode); setConnectionStart(null); }}
                        className={`w-full p-2 text-xs border font-bold uppercase transition-all
                            ${linkMode ? 'bg-yellow-500 text-black border-yellow-500 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-600'}
                        `}
                    >
                        {linkMode ? 'LINKING MODE ON' : 'ENABLE LINKING'}
                    </button>
                    <p className="text-[9px] text-slate-500 mt-1">
                        {linkMode ? 'Tap Parent then Child to connect.' : 'Drag to move. Shift+Click to link.'}
                    </p>
                </div>

                <div className="mt-auto text-[10px] text-slate-500 hidden lg:block">
                    <p>DRAG to move nodes</p>
                    <p>CLICK to select</p>
                    <p>SHIFT+CLICK to connect</p>
                </div>
            </div>

            {/* Canvas */}
            <div 
                ref={canvasRef}
                className="flex-1 bg-slate-950 relative overflow-hidden cursor-crosshair ml-48 lg:ml-0"
                onMouseMove={handleMouseMove}
                onMouseUp={() => {
                    setDraggingId(null);
                    // Don't clear connectionStart here if in linkMode
                    if (!linkMode) setConnectionStart(null);
                }}
                onMouseLeave={() => {
                    setDraggingId(null);
                    setConnectionStart(null);
                }}
            >
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                {/* Connections SVG Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                    {build.aiConfig.treeNodes.map(node => 
                        node.children.map(childId => {
                            const child = build.aiConfig.treeNodes.find(n => n.id === childId);
                            if (!child) return null;
                            
                            // Exact center calculations based on fixed NODE_WIDTH/HEIGHT
                            const startX = node.x + (NODE_WIDTH / 2);
                            const startY = node.y + NODE_HEIGHT;
                            const endX = child.x + (NODE_WIDTH / 2);
                            const endY = child.y;

                            return (
                                <g key={`${node.id}-${childId}`}>
                                    <path 
                                        d={getPath(startX, startY, endX, endY)}
                                        stroke="#1e293b" strokeWidth="4" fill="none"
                                    />
                                    <path 
                                        d={getPath(startX, startY, endX, endY)}
                                        stroke="#475569" strokeWidth="2" fill="none"
                                    />
                                </g>
                            );
                        })
                    )}
                </svg>

                {/* Nodes */}
                {build.aiConfig.treeNodes.map(node => (
                    <div
                        key={node.id}
                        style={{ 
                            left: node.x, 
                            top: node.y, 
                            width: NODE_WIDTH, 
                            height: NODE_HEIGHT 
                        }}
                        className={`absolute bg-slate-900 border rounded flex flex-col items-center justify-center select-none shadow-lg z-10 transition-colors cursor-pointer
                            ${selectedNodeId === node.id ? 'border-white' : 'border-slate-600'}
                            ${connectionStart === node.id ? 'border-yellow-500 ring-2 ring-yellow-500/50' : ''}
                            ${node.type === 'ROOT' ? 'border-purple-500' : ''}
                        `}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            // Logic: If Shift key OR Link Mode active
                            if (e.shiftKey || linkMode) {
                                if (!connectionStart) {
                                    setConnectionStart(node.id);
                                } else {
                                    toggleConnection(connectionStart, node.id);
                                    setConnectionStart(null);
                                }
                            } else {
                                setSelectedNodeId(node.id);
                                setDraggingId(node.id);
                            }
                        }}
                    >
                        <div className={`text-[10px] font-bold uppercase mb-1
                             ${node.type === 'CONDITION' ? 'text-yellow-500' : 
                               node.type === 'ACTION' ? 'text-red-500' : 
                               'text-cyan-500'}
                        `}>
                            {node.type}
                        </div>
                        <div className="text-xs text-white truncate px-2 max-w-full text-center">{node.label}</div>
                        
                        {/* Input/Output Ports Visuals */}
                        {node.type !== 'ACTION' && (
                             <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-500 rounded-full border border-black"></div>
                        )}
                        {node.type !== 'ROOT' && (
                             <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-500 rounded-full border border-black"></div>
                        )}
                        
                        {connectionStart === node.id && (
                             <div className="absolute -top-2 w-full text-center text-[9px] bg-yellow-500 text-black">CONNECTING...</div>
                        )}
                    </div>
                ))}
            </div>

            {/* Properties Panel (Overlay on mobile when selected) */}
            {selectedNodeId && (
                <div className="w-64 bg-slate-900 border-l border-slate-700 p-4 z-20 overflow-y-auto absolute right-0 top-0 bottom-0 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-xs text-slate-400 uppercase font-bold">Node Properties</div>
                        <button onClick={() => setSelectedNodeId(null)} className="text-slate-400 lg:hidden">✕</button>
                    </div>
                    <div className="space-y-4">
                        {(() => {
                            const node = build.aiConfig.treeNodes.find(n => n.id === selectedNodeId);
                            if (!node) return null;
                            return (
                                <>
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase">Label</label>
                                        <input 
                                            value={node.label}
                                            onChange={(e) => {
                                                const nodes = build.aiConfig.treeNodes.map(n => n.id === node.id ? { ...n, label: e.target.value } : n);
                                                onUpdate(nodes);
                                            }}
                                            className="w-full bg-slate-800 border border-slate-700 text-white text-xs p-1"
                                        />
                                    </div>
                                    
                                    {/* Config Editors */}
                                    {node.type === 'CONDITION' && (
                                        <>
                                            <div>
                                                <label className="text-[10px] text-slate-500 uppercase">Condition</label>
                                                <select
                                                    value={node.config?.condition || 'range_less'}
                                                    onChange={(e) => updateNodeConfig(node.id, { condition: e.target.value }, e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs p-1"
                                                >
                                                    <option value="range_less">Range &lt; X</option>
                                                    <option value="range_more">Range &gt; X</option>
                                                    <option value="hp_less">HP &lt; X%</option>
                                                    <option value="hp_more">HP &gt; X%</option>
                                                    <option value="stability_less">Stability &lt; X%</option>
                                                    <option value="energy_less">Energy &lt; X%</option>
                                                    <option value="ammo_less">Total Ammo &lt; X%</option>
                                                    <option value="time_elapsed">Time &gt; X sec</option>
                                                    <option value="enemy_staggered">Enemy Staggered</option>
                                                    <option value="visible">Visible (LoS)</option>
                                                    <option value="cover_available">Cover Nearby</option>
                                                    <option value="enemy_count">Enemies Alive &gt; 0</option>
                                                </select>
                                            </div>
                                            {node.config?.condition !== 'visible' && 
                                             node.config?.condition !== 'cover_available' && 
                                             node.config?.condition !== 'enemy_count' && 
                                             node.config?.condition !== 'enemy_staggered' && (
                                                <div>
                                                    <label className="text-[10px] text-slate-500 uppercase">Parameter (X)</label>
                                                    <input 
                                                        type="number"
                                                        value={node.config?.param || '0'}
                                                        onChange={(e) => updateNodeConfig(node.id, { param: e.target.value }, `${node.config?.condition?.split('_').join(' ')} ${e.target.value}`)}
                                                        className="w-full bg-slate-800 border border-slate-700 text-white text-xs p-1"
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {node.type === 'ACTION' && (
                                        <div>
                                            <label className="text-[10px] text-slate-500 uppercase">Action</label>
                                            <select
                                                value={node.config?.action || 'attack_right'}
                                                onChange={(e) => updateNodeConfig(node.id, { action: e.target.value }, e.target.value.replace('_', ' '))}
                                                className="w-full bg-slate-800 border border-slate-700 text-white text-xs p-1"
                                            >
                                                <option value="attack_right">Attack (R)</option>
                                                <option value="attack_left">Attack (L)</option>
                                                <option value="fire_all">Alpha Strike (All)</option>
                                                <option value="move_forward">Move Forward</option>
                                                <option value="retreat">Retreat</option>
                                                <option value="strafe_left">Strafe Left</option>
                                                <option value="strafe_right">Strafe Right</option>
                                                <option value="boost_dash">Boost Dash</option>
                                                <option value="take_cover">Take Cover</option>
                                            </select>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-slate-800">
                                        <button 
                                            onClick={() => deleteNode(node.id)}
                                            className="w-full py-1 bg-red-900/50 text-red-500 border border-red-900 hover:bg-red-900 text-xs"
                                        >
                                            Delete Node
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AITreeEditor;
