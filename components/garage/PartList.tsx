
import React, { useMemo } from 'react';
import { PartCategory, MechPart, MechBuild, PlayerProfile, DebugSettings } from '../../types';
import { DEFAULT_PARTS } from '../../constants';

interface PartListProps {
    selectedCategory: PartCategory;
    setSelectedCategory: (cat: PartCategory) => void;
    build: MechBuild;
    ownedPartIds: Set<string>;
    money: number;
    profile: PlayerProfile;
    onHover: (part: MechPart | null) => void;
    onAction: (part: MechPart) => void;
    debugSettings: DebugSettings;
}

const PartList: React.FC<PartListProps> = ({ 
    selectedCategory, setSelectedCategory, build, ownedPartIds, money, profile, onHover, onAction, debugSettings
}) => {
    const availableParts = useMemo(() => DEFAULT_PARTS.filter(p => p.category === selectedCategory), [selectedCategory]);

    const categoryGroups = [
        { name: 'FRAME', items: [PartCategory.HEAD, PartCategory.CORE, PartCategory.ARMS, PartCategory.LEGS] },
        { name: 'INTERNALS', items: [PartCategory.GENERATOR, PartCategory.RADIATOR, PartCategory.FCS, PartCategory.BOOSTER] },
        { name: 'WEAPONS', items: [PartCategory.WEAPON_R, PartCategory.WEAPON_L, PartCategory.BACK_L, PartCategory.BACK_R] },
    ];

    return (
        <div className="w-full lg:w-1/4 h-1/3 lg:h-full bg-slate-900/90 border-r border-slate-700 flex flex-col z-10 order-2 lg:order-1">
            {/* Category Groups */}
            <div className="overflow-x-auto bg-slate-950">
                {categoryGroups.map(group => (
                    <div key={group.name} className="border-b border-slate-800">
                        <div className="px-2 py-1 text-[10px] text-slate-500 font-bold bg-slate-900">{group.name}</div>
                        <div className="flex flex-wrap p-1 gap-1">
                            {group.items.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`flex-1 min-w-[60px] text-[10px] py-2 px-1 border transition-all
                                        ${selectedCategory === cat 
                                            ? 'border-cyan-500 bg-cyan-900/40 text-cyan-300' 
                                            : 'border-slate-800 text-slate-400 hover:border-slate-600'}`}
                                >
                                    {cat.replace(/_/g, ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Part List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {availableParts.map(part => {
                    const isEquipped = build.parts[part.category].id === part.id;
                    const isOwned = ownedPartIds.has(part.id);
                    const canAfford = money >= part.cost;
                    const isLevelLocked = (part.unlockLevel || 0) > profile.level;
                    const isLocked = isLevelLocked && !(debugSettings.enabled && debugSettings.unlockAllParts);

                    return (
                        <div 
                            key={part.id}
                            onMouseEnter={() => !isLocked && onHover(part)}
                            onMouseLeave={() => onHover(null)}
                            className={`p-2 border transition-all relative group flex flex-col
                                ${isEquipped 
                                    ? 'border-yellow-500 bg-yellow-900/10' 
                                    : isLocked
                                        ? 'border-slate-800 bg-slate-900 opacity-60 cursor-not-allowed'
                                        : isOwned 
                                            ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-cyan-500 cursor-pointer'
                                            : 'border-slate-800 bg-slate-950 opacity-90 hover:opacity-100 hover:border-slate-600 cursor-pointer'
                                }
                            `}
                            onClick={() => onAction(part)}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`font-mono text-sm font-bold ${isLocked ? 'text-slate-600' : isEquipped ? 'text-yellow-400' : isOwned ? 'text-slate-200' : 'text-slate-500'}`}>{part.name}</span>
                                {isLocked ? (
                                    <span className="text-[10px] text-red-900 border border-red-900 px-1">LVL {part.unlockLevel}</span>
                                ) : !isOwned && (
                                    <span className={`text-xs font-mono px-1 border ${canAfford ? 'text-green-400 border-green-900' : 'text-red-500 border-red-900'}`}>
                                        {canAfford ? 'BUY ' : 'NEED '}{part.cost.toLocaleString()}
                                    </span>
                                )}
                                {isOwned && !isEquipped && <span className="text-[9px] text-cyan-500 uppercase">Owned</span>}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{part.description}</p>
                            
                            {isEquipped && <div className="absolute top-1 right-1 w-2 h-3 bg-yellow-500 rounded-sm"></div>}
                            {isLocked && <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center pointer-events-none">
                                <span className="text-xl">🔒</span>
                            </div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PartList;
