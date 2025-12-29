
import React from 'react';
import { MechBuild, BattleFrame, BattleResult, EnemyProfile } from '../../types';

interface ArenaHUDProps {
    playerBuild: MechBuild;
    selectedEnemy: EnemyProfile | null;
    currentFrame?: BattleFrame;
    battleResult: BattleResult | null;
}

const WeaponSlot = ({ 
    label, 
    type, 
    ammo, 
    maxAmmo, 
    cooldown, 
    isFiring, 
    align = 'left' 
}: { 
    label: string, 
    type: string, 
    ammo: number, 
    maxAmmo: number, 
    cooldown: number, 
    isFiring: boolean, 
    align?: 'left' | 'right' 
}) => {
    const isReloading = cooldown > 0;
    const pct = maxAmmo > 0 ? (ammo / maxAmmo) * 100 : 0;
    const isEmpty = maxAmmo > 0 && ammo <= 0;
    const isNone = type === 'NONE';

    if (isNone) return <div className="h-10 w-full bg-slate-900/50 border border-slate-800 opacity-30"></div>;

    return (
        <div className={`h-10 w-full bg-slate-900/80 border flex flex-col justify-center px-2 relative overflow-hidden transition-all
            ${isFiring ? 'border-yellow-400 bg-yellow-900/20' : 'border-slate-700'}
            ${isEmpty ? 'opacity-50 grayscale' : ''}
        `}>
            {/* Ammo Bar Background */}
            <div className={`absolute bottom-0 left-0 h-1 bg-slate-700 w-full`}>
                <div 
                    className={`h-full ${isEmpty ? 'bg-red-500' : 'bg-cyan-500'}`} 
                    style={{ width: `${pct}%` }}
                ></div>
            </div>

            {/* Cooldown Overlay */}
            {isReloading && (
                <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                    <div className="text-[9px] text-yellow-500 font-mono tracking-widest animate-pulse">RELOADING</div>
                </div>
            )}

            <div className={`flex justify-between items-end relative z-0 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
                <div>
                    <div className="text-[8px] text-slate-400 leading-none mb-0.5">{label}</div>
                    <div className="text-[10px] font-bold text-white leading-none truncate w-16">{type}</div>
                </div>
                <div className={`text-right ${align === 'right' ? 'text-left' : ''}`}>
                    {maxAmmo > 0 ? (
                        <div className={`font-mono text-xs leading-none ${isEmpty ? 'text-red-500' : 'text-cyan-400'}`}>
                            {ammo}<span className="text-[8px] text-slate-500">/{maxAmmo}</span>
                        </div>
                    ) : (
                        <div className="text-[8px] text-slate-500">INF</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ArenaHUD: React.FC<ArenaHUDProps> = ({ playerBuild, selectedEnemy, currentFrame, battleResult }) => {
    const playerHp = currentFrame?.player.hp || 0;
    const enemyHp = currentFrame?.enemy.hp || 0;
    const playerHeat = currentFrame?.player.heat || 0;
    const enemyHeat = currentFrame?.enemy.heat || 0;
    const playerMaxHp = currentFrame?.player.maxHp || playerBuild.stats.ap;
    const enemyMaxHp = currentFrame?.enemy.maxHp || selectedEnemy?.build.stats.ap || 5000;
    
    // Default heat cap usually 3000 if not specified
    const playerMaxHeat = playerBuild.stats.heatCapacity || 3000;
    const enemyMaxHeat = selectedEnemy?.build.stats.heatCapacity || 3000;

    // Stability
    const playerStab = currentFrame?.player.stability || 0;
    const playerMaxStab = currentFrame?.player.maxStability || 1000;
    const enemyStab = currentFrame?.enemy.stability || 0;
    const enemyMaxStab = currentFrame?.enemy.maxStability || 1000;

    const p = currentFrame?.player;
    const e = currentFrame?.enemy;

    // Find latest AI decision for player
    const lastPlayerDecision = currentFrame?.events
        .filter(ev => ev.type === 'AI_DECISION' && ev.sourceId === 'PLAYER')
        .pop()?.message || 'SYSTEM READY';

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 md:p-4 z-50">
             {/* TOP HUD: HEALTH & STATUS */}
             <div className="flex justify-between items-start w-full">
                 {/* PLAYER STATUS (TOP LEFT) */}
                 <div className="w-48 md:w-72 pointer-events-auto">
                    <div className="text-cyan-400 font-bold mb-1 truncate text-shadow-sm flex justify-between items-end">
                        <span>{playerBuild.name}</span>
                        <span className="text-[9px] text-slate-500 font-mono tracking-widest">AP {Math.floor(playerHp)}</span>
                    </div>
                    {/* HP Bar */}
                    <div className="h-3 md:h-4 bg-slate-900/90 border border-slate-600 relative mb-1 skew-x-[-10deg] overflow-hidden">
                        <div className="h-full bg-cyan-600 transition-all duration-100" style={{ width: `${Math.min((playerHp / playerMaxHp) * 100, 100)}%` }}></div>
                        {/* HP Grid Lines */}
                        <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQYlWNgYGD4z0AEYBxViC+UqB88QA718Yd1kwAAAABJRU5ErkJggg==')] opacity-20"></div>
                    </div>
                    {/* Stability Bar (ACS) */}
                    <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-1.5 bg-slate-900/90 border border-yellow-700/50 relative overflow-hidden skew-x-[-10deg]">
                            <div 
                                className={`h-full transition-all duration-100 ${currentFrame?.player.isStaggered ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}
                                style={{ width: `${Math.min((playerStab / playerMaxStab) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <span className={`text-[8px] font-mono w-6 text-right ${currentFrame?.player.isStaggered ? 'text-red-500 animate-pulse font-bold' : 'text-yellow-500'}`}>ACS</span>
                    </div>
                    {/* Heat Bar */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-900/90 border border-slate-700/50 relative overflow-hidden group skew-x-[-10deg]">
                            <div 
                                className={`h-full transition-all duration-100 ${currentFrame?.player.isOverheated ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} 
                                style={{ width: `${Math.min((playerHeat / playerMaxHeat) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <span className="text-[8px] text-slate-500 font-mono w-6 text-right">HEAT</span>
                    </div>
                    {/* AI State Indicator */}
                    <div className="mt-2 text-[10px] font-mono text-cyan-300 border-l-2 border-cyan-500 pl-2 opacity-80 uppercase">
                        AI: {lastPlayerDecision}
                    </div>
                 </div>
                 
                 {/* CENTER TIMER */}
                 <div className="flex flex-col items-center gap-1 mx-2 mt-[-5px]">
                     <div className="text-yellow-500 font-mono text-2xl font-bold bg-slate-900/90 px-4 pt-2 pb-1 rounded-b-lg border-x border-b border-slate-700 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        {Math.floor((currentFrame?.tick || 0) / 60)}<span className="text-sm ml-1">s</span>
                     </div>
                     {currentFrame?.player.isStaggered && <div className="text-red-500 text-[10px] font-bold bg-black/80 px-2 animate-pulse">WARNING: STAGGER</div>}
                 </div>

                 {/* ENEMY STATUS (TOP RIGHT) */}
                 <div className="w-48 md:w-72 text-right pointer-events-auto">
                    <div className="text-red-400 font-bold mb-1 truncate text-shadow-sm flex justify-between items-end flex-row-reverse">
                        <span>{selectedEnemy?.name || battleResult?.enemyName || 'TARGET'}</span>
                        <span className="text-[9px] text-slate-500 font-mono tracking-widest">AP {Math.floor(enemyHp)}</span>
                    </div>
                    {/* HP Bar */}
                    <div className="h-3 md:h-4 bg-slate-900/90 border border-slate-600 relative mb-1 skew-x-[10deg] overflow-hidden flex justify-end">
                        <div className="h-full bg-red-600 transition-all duration-100" style={{ width: `${Math.min((enemyHp / enemyMaxHp) * 100, 100)}%` }}></div>
                        <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQYlWNgYGD4z0AEYBxViC+UqB88QA718Yd1kwAAAABJRU5ErkJggg==')] opacity-20"></div>
                    </div>
                    {/* Stability Bar (ACS) */}
                    <div className="flex items-center gap-2 mb-1 justify-end">
                        <span className={`text-[8px] font-mono w-6 text-left ${currentFrame?.enemy.isStaggered ? 'text-red-500 animate-pulse font-bold' : 'text-yellow-500'}`}>ACS</span>
                        <div className="flex-1 h-1.5 bg-slate-900/90 border border-yellow-700/50 relative overflow-hidden flex justify-end skew-x-[10deg]">
                            <div 
                                className={`h-full transition-all duration-100 ${currentFrame?.enemy.isStaggered ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}
                                style={{ width: `${Math.min((enemyStab / enemyMaxStab) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                    {/* Heat Bar */}
                    <div className="flex items-center gap-2 justify-end">
                        <span className="text-[8px] text-slate-500 font-mono w-6 text-left">HEAT</span>
                        <div className="flex-1 h-1.5 bg-slate-900/90 border border-slate-700/50 relative overflow-hidden group flex justify-end skew-x-[10deg]">
                             <div 
                                className={`h-full transition-all duration-100 ${currentFrame?.enemy.isOverheated ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} 
                                style={{ width: `${Math.min((enemyHeat / enemyMaxHeat) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                 </div>
             </div>

             {/* BOTTOM HUD: WEAPONS */}
             <div className="flex justify-between items-end w-full mb-12 md:mb-0">
                 {/* PLAYER WEAPONS */}
                 <div className="grid grid-cols-2 gap-1 w-48 md:w-64 pointer-events-auto">
                     {p && (
                         <>
                             <WeaponSlot label="L-ARM" type={p.visualConfig?.weaponL || 'NONE'} ammo={p.weaponLAmmo} maxAmmo={p.maxWeaponLAmmo} cooldown={p.weaponLCooldown} isFiring={p.isFiringL} />
                             <WeaponSlot label="R-ARM" type={p.visualConfig?.weaponR || 'NONE'} ammo={p.weaponRAmmo} maxAmmo={p.maxWeaponRAmmo} cooldown={p.weaponRCooldown} isFiring={p.isFiringR} align="right" />
                             <WeaponSlot label="L-BACK" type={p.visualConfig?.backL || 'NONE'} ammo={p.backLAmmo} maxAmmo={p.maxBackLAmmo} cooldown={p.backLCooldown} isFiring={p.isFiringBackL} />
                             <WeaponSlot label="R-BACK" type={p.visualConfig?.backR || 'NONE'} ammo={p.backRAmmo} maxAmmo={p.maxBackRAmmo} cooldown={p.backRCooldown} isFiring={p.isFiringBackR} align="right" />
                         </>
                     )}
                 </div>

                 {/* ENEMY WEAPONS (Simplified View) */}
                 <div className="grid grid-cols-2 gap-1 w-48 md:w-64 pointer-events-auto opacity-80">
                     {e && (
                         <>
                             <WeaponSlot label="L-ARM" type={e.visualConfig?.weaponL || 'NONE'} ammo={e.weaponLAmmo} maxAmmo={e.maxWeaponLAmmo} cooldown={e.weaponLCooldown} isFiring={e.isFiringL} align="right" />
                             <WeaponSlot label="R-ARM" type={e.visualConfig?.weaponR || 'NONE'} ammo={e.weaponRAmmo} maxAmmo={e.maxWeaponRAmmo} cooldown={e.weaponRCooldown} isFiring={e.isFiringR} />
                             <WeaponSlot label="L-BACK" type={e.visualConfig?.backL || 'NONE'} ammo={e.backLAmmo} maxAmmo={e.maxBackLAmmo} cooldown={e.backLCooldown} isFiring={e.isFiringBackL} align="right" />
                             <WeaponSlot label="R-BACK" type={e.visualConfig?.backR || 'NONE'} ammo={e.backRAmmo} maxAmmo={e.maxBackRAmmo} cooldown={e.backRCooldown} isFiring={e.isFiringBackR} />
                         </>
                     )}
                 </div>
             </div>
        </div>
    );
};

export default ArenaHUD;
