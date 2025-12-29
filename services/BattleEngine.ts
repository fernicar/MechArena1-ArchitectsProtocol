
import { MechBuild, BattleResult, BattleFrame, MechBattleState, Vector2, Projectile, BattleEvent, PartCategory, Obstacle, MechPart } from '../types';
import { RNG, dist, angleTo, intersectLineRect, pointInRect } from '../utils/battleMath';
import { processAI } from './battleAI';
import { MECH_COLORS } from '../constants';

export const ARENA_SIZE = { width: 800, height: 600 };
const TICKS_PER_SECOND = 60;
const MAX_TIME_SECONDS = 180;
const MAX_TICKS = TICKS_PER_SECOND * MAX_TIME_SECONDS;
const MECH_RADIUS = 20;

// Helper to map color names to hex
const resolveColor = (colorId: string): string => {
    const found = MECH_COLORS.find(c => c.id === colorId.toLowerCase());
    return found ? found.hex : '#71717a'; // Default zinc
};

export interface BattleOptions {
    seed?: number;
    arenaType?: string;
}

class BattleEngine {
    frames: BattleFrame[] = [];
    playerState: MechBattleState;
    enemyState: MechBattleState;
    projectiles: Projectile[] = [];
    obstacles: Obstacle[] = [];
    currentTick: number = 0;
    arenaType: string = 'OPEN';
    rng: RNG;
    
    playerBuild: MechBuild;
    enemyBuild: MechBuild;

    constructor(player: MechBuild, enemy: MechBuild, options: BattleOptions = {}) {
        this.playerBuild = player;
        this.enemyBuild = enemy;
        this.rng = new RNG(options.seed || Date.now());
        
        this.playerState = this.createInitialState('PLAYER', player, { x: 100, y: 300 }, 0);
        this.enemyState = this.createInitialState('ENEMY', enemy, { x: 700, y: 300 }, Math.PI);
        
        this.generateArena(options.arenaType);
    }

    generateArena(forcedType?: string) {
        const types = ['OPEN', 'PILLARS', 'URBAN', 'WASTELAND'];
        // If forcedType is valid, use it. Otherwise random.
        if (forcedType && types.includes(forcedType)) {
            this.arenaType = forcedType;
        } else {
            this.arenaType = types[Math.floor(this.rng.next() * types.length)];
        }
        
        if (this.arenaType === 'PILLARS') {
            this.obstacles.push(
                { id: 'o1', x: 300, y: 150, width: 50, height: 50, type: 'PILLAR' },
                { id: 'o2', x: 450, y: 400, width: 50, height: 50, type: 'PILLAR' },
                { id: 'o3', x: 375, y: 275, width: 50, height: 50, type: 'PILLAR' }
            );
        } else if (this.arenaType === 'URBAN') {
            this.obstacles.push(
                { id: 'o1', x: 200, y: 100, width: 100, height: 100, type: 'WALL' },
                { id: 'o2', x: 500, y: 400, width: 100, height: 100, type: 'WALL' },
                { id: 'o3', x: 380, y: 250, width: 40, height: 100, type: 'WALL' }
            );
        } else if (this.arenaType === 'WASTELAND') {
            this.obstacles.push(
                 { id: 'o1', x: 200, y: 150, width: 60, height: 60, type: 'DEBRIS' },
                 { id: 'o2', x: 550, y: 400, width: 60, height: 60, type: 'DEBRIS' },
                 { id: 'o3', x: 380, y: 280, width: 40, height: 40, type: 'PILLAR' }
            );
        }
    }

    createInitialState(id: string, build: MechBuild, pos: Vector2, rot: number): MechBattleState {
        // Calculate Max Stability based on weight and legs
        // Heavy mechs (10000+) -> ~3000 stability
        // Light mechs (5000) -> ~1500 stability
        // Tank legs get bonus
        let baseStability = (build.stats.weight * 0.25) + (build.stats.defense * 0.5);
        if (build.parts.LEGS.spec?.legType === 'TANK') baseStability *= 1.5;
        if (build.parts.LEGS.spec?.legType === 'QUAD') baseStability *= 1.2;
        
        const legType = build.parts.LEGS.spec?.legType || 'BIPED';
        
        // Handle cosmetic resolution with fallbacks
        const primary = build.cosmetics?.primary || build.color || (id === 'PLAYER' ? 'cyan' : 'red');
        const secondary = build.cosmetics?.secondary || (id === 'PLAYER' ? 'slate' : 'black');
        const pattern = build.cosmetics?.pattern || 'SOLID';

        return {
            id,
            position: pos,
            rotation: rot,
            velocity: { x: 0, y: 0 },
            targetRotation: rot,
            hp: build.stats.ap,
            maxHp: build.stats.ap,
            energy: build.stats.energyCapacity,
            maxEnergy: build.stats.energyCapacity,
            heat: 0,
            maxHeat: build.stats.heatCapacity || 3000,
            
            // Stability Init
            stability: baseStability,
            maxStability: baseStability,
            isStaggered: false,
            staggerTimer: 0,
            
            weaponRAmmo: build.parts[PartCategory.WEAPON_R].stats.ammo || 0,
            maxWeaponRAmmo: build.parts[PartCategory.WEAPON_R].stats.ammo || 0,
            weaponLAmmo: build.parts[PartCategory.WEAPON_L].stats.ammo || 0,
            maxWeaponLAmmo: build.parts[PartCategory.WEAPON_L].stats.ammo || 0,
            backLAmmo: build.parts[PartCategory.BACK_L].stats.ammo || 0,
            maxBackLAmmo: build.parts[PartCategory.BACK_L].stats.ammo || 0,
            backRAmmo: build.parts[PartCategory.BACK_R].stats.ammo || 0,
            maxBackRAmmo: build.parts[PartCategory.BACK_R].stats.ammo || 0,

            weaponRCooldown: 0,
            weaponLCooldown: 0,
            backLCooldown: 0,
            backRCooldown: 0,
            
            isBoosting: false,
            isFiringR: false,
            isFiringL: false,
            isFiringBackL: false,
            isFiringBackR: false,
            isOverheated: false,
            isShielded: false,
            shieldTime: 0,
            
            visualConfig: {
                legType,
                baseColor: resolveColor(primary),
                secondaryColor: resolveColor(secondary),
                pattern: pattern,
                weaponR: build.parts[PartCategory.WEAPON_R].spec?.weaponType || 'NONE',
                weaponL: build.parts[PartCategory.WEAPON_L].spec?.weaponType || 'NONE',
                backL: build.parts[PartCategory.BACK_L].spec?.weaponType || 'NONE',
                backR: build.parts[PartCategory.BACK_R].spec?.weaponType || 'NONE'
            }
        };
    }

    run(): BattleResult {
        while (this.currentTick < MAX_TICKS && this.playerState.hp > 0 && this.enemyState.hp > 0) {
            this.tick();
        }

        let winner: 'PLAYER' | 'ENEMY';
        if (this.playerState.hp <= 0) winner = 'ENEMY';
        else if (this.enemyState.hp <= 0) winner = 'PLAYER';
        else {
            const pPct = this.playerState.hp / this.playerState.maxHp;
            const ePct = this.enemyState.hp / this.enemyState.maxHp;
            winner = pPct >= ePct ? 'PLAYER' : 'ENEMY';
        }

        return {
            winner,
            frames: this.frames,
            duration: this.currentTick,
            log: [],
            obstacles: this.obstacles,
            arenaType: this.arenaType
        };
    }

    tick() {
        const events: BattleEvent[] = [];

        // Handle Stagger State Duration
        const handleStatus = (mech: MechBattleState) => {
            if (mech.isStaggered) {
                mech.staggerTimer--;
                if (mech.staggerTimer <= 0) {
                    mech.isStaggered = false;
                    mech.stability = mech.maxStability; // Recover full stability
                }
            } else {
                // Regenerate stability slowly if not staggered
                if (mech.stability < mech.maxStability) {
                    mech.stability += mech.maxStability / 600; // 10 sec to full recover
                }
            }
        };
        handleStatus(this.playerState);
        handleStatus(this.enemyState);

        // Only process AI if not staggered
        if (!this.playerState.isStaggered) {
            processAI(this.playerState, this.playerBuild, this.enemyState, events, this.obstacles, this.currentTick, this.rng);
        } else {
            // Reset actions if staggered
            this.playerState.isBoosting = false;
            this.playerState.isFiringR = false;
            this.playerState.isFiringL = false;
            this.playerState.isFiringBackL = false;
            this.playerState.isFiringBackR = false;
        }

        if (!this.enemyState.isStaggered) {
            processAI(this.enemyState, this.enemyBuild, this.playerState, events, this.obstacles, this.currentTick, this.rng);
        } else {
            this.enemyState.isBoosting = false;
            this.enemyState.isFiringR = false;
            this.enemyState.isFiringL = false;
            this.enemyState.isFiringBackL = false;
            this.enemyState.isFiringBackR = false;
        }

        this.updatePhysics(this.playerState, this.playerBuild);
        this.updatePhysics(this.enemyState, this.enemyBuild);

        this.updateCombat(this.playerState, this.playerBuild, this.enemyState, events);
        this.updateCombat(this.enemyState, this.enemyBuild, this.playerState, events);
        this.updateProjectiles(events);

        this.updateResources(this.playerState, this.playerBuild);
        this.updateResources(this.enemyState, this.enemyBuild);

        this.frames.push({
            tick: this.currentTick,
            player: JSON.parse(JSON.stringify(this.playerState)),
            enemy: JSON.parse(JSON.stringify(this.enemyState)),
            projectiles: JSON.parse(JSON.stringify(this.projectiles)),
            events
        });

        this.currentTick++;
    }

    updatePhysics(mech: MechBattleState, build: MechBuild) {
        mech.velocity.x *= 0.92;
        mech.velocity.y *= 0.92;
        
        // Cannot move intentionally if staggered (but physics still apply)
        if (mech.isBoosting && mech.energy > 0 && !mech.isStaggered) {
            mech.energy -= 5 + (build.stats.weight / 500);
            mech.heat += 8;
        }

        const nextX = mech.position.x + mech.velocity.x;
        const nextY = mech.position.y + mech.velocity.y;
        
        if (nextX > 0 && nextX < ARENA_SIZE.width && nextY > 0 && nextY < ARENA_SIZE.height) {
            mech.position.x = nextX;
            mech.position.y = nextY;
        } else {
            mech.velocity.x *= -0.5;
            mech.velocity.y *= -0.5;
        }

        for (const obs of this.obstacles) {
             if (pointInRect(mech.position.x, mech.position.y, obs.x - MECH_RADIUS, obs.y - MECH_RADIUS, obs.width + MECH_RADIUS*2, obs.height + MECH_RADIUS*2)) {
                 const dx = mech.position.x - (obs.x + obs.width/2);
                 const dy = mech.position.y - (obs.y + obs.height/2);
                 mech.velocity.x += Math.sign(dx) * 1;
                 mech.velocity.y += Math.sign(dy) * 1;
             }
        }

        // Only rotate if not staggered
        if (!mech.isStaggered) {
            const diff = mech.targetRotation - mech.rotation;
            let d = Math.atan2(Math.sin(diff), Math.cos(diff));
            mech.rotation += d * 0.1;
        }
    }

    updateCombat(mech: MechBattleState, build: MechBuild, target: MechBattleState, events: BattleEvent[]) {
        if (mech.weaponRCooldown > 0) mech.weaponRCooldown--;
        if (mech.weaponLCooldown > 0) mech.weaponLCooldown--;
        if (mech.backLCooldown > 0) mech.backLCooldown--;
        if (mech.backRCooldown > 0) mech.backRCooldown--;

        if (mech.shieldTime > 0) {
            mech.isShielded = true;
            mech.shieldTime--;
        } else {
            mech.isShielded = false;
        }

        if (mech.energy <= 0 || mech.isStaggered) return;

        const tryFire = (isActive: boolean, cooldown: number, ammo: number, partCat: PartCategory, slot: 'R'|'L'|'BL'|'BR') => {
             if (isActive && cooldown <= 0 && ammo > 0) {
                 this.fireWeapon(mech, build.parts[partCat], slot, events, build, target);
             }
        };

        tryFire(mech.isFiringR, mech.weaponRCooldown, mech.weaponRAmmo, PartCategory.WEAPON_R, 'R');
        tryFire(mech.isFiringL, mech.weaponLCooldown, mech.weaponLAmmo, PartCategory.WEAPON_L, 'L');
        tryFire(mech.isFiringBackL, mech.backLCooldown, mech.backLAmmo, PartCategory.BACK_L, 'BL');
        tryFire(mech.isFiringBackR, mech.backRCooldown, mech.backRAmmo, PartCategory.BACK_R, 'BR');
    }

    fireWeapon(mech: MechBattleState, part: MechPart, slot: 'R'|'L'|'BL'|'BR', events: BattleEvent[], build: MechBuild, target: MechBattleState) {
        if (!part.spec) return;
        
        const type = part.spec.weaponType || 'RIFLE';
        const cost = part.stats.energyDrain || 10;
        let heat = 150; 
        let dmg = part.stats.firepower || 100;
        let delay = Math.max(10, 60 - (dmg / 100)); 
        
        // Calculate Impact (Stability Damage)
        let impact = dmg * 0.5; // Base impact

        // Weapon Archetype Logic
        if (type === 'MACHINE_GUN') {
            delay = 6;
            heat = 40;
            impact = dmg * 0.2; // Low impact per shot
        } else if (type === 'BAZOOKA') {
            delay = 120;
            heat = 400;
            impact = dmg * 1.5; // Massive impact
        } else if (type === 'CANNON') {
            delay = 150;
            heat = 600;
            impact = dmg * 1.2;
        } else if (type === 'RIFLE' && part.spec.range === 'LONG') {
            delay = 100;
            heat = 350;
            impact = dmg * 0.8;
        } else if (type === 'BLADE') {
            heat = 100;
            impact = dmg * 1.0;
        } else if (type === 'MISSILE') {
            heat = 250;
            impact = dmg * 1.0;
        }

        // Pile Bunker Special
        if (part.id === 'w_l_03') impact = dmg * 2.0;

        mech.energy -= cost;
        mech.heat += heat;
        if (slot === 'R') { mech.weaponRCooldown = delay; mech.weaponRAmmo--; }
        if (slot === 'L') { mech.weaponLCooldown = delay; mech.weaponLAmmo--; }
        if (slot === 'BL') { mech.backLCooldown = delay; mech.backLAmmo--; }
        if (slot === 'BR') { mech.backRCooldown = delay; mech.backRAmmo--; }

        events.push({ type: 'FIRE', sourceId: mech.id });

        if (type === 'SHIELD') {
            mech.shieldTime = 40; 
            if (slot === 'L') mech.weaponLCooldown = 90;
            return;
        }

        // BLADE & PILE BUNKER Logic
        if (type === 'BLADE') {
            const d = dist(mech.position, target.position);
            const angle = angleTo(mech.position, target.position);
            const angleDiff = Math.abs(Math.atan2(Math.sin(mech.rotation - angle), Math.cos(mech.rotation - angle)));
            
            let range = 80;
            if (part.id === 'w_l_03') range = 40; 

            if (d < range && angleDiff < 0.8) {
                events.push({ type: 'MELEE_HIT', sourceId: mech.id, targetId: target.id, damage: dmg, location: { ...target.position } });
                this.applyDamage(target, dmg, impact, events);
            }
            return;
        }

        // Projectile Setup
        let projSpeed = 10 + (dmg / 500);
        let projType = type;
        const isMissile = type === 'MISSILE';
        
        if (type === 'MACHINE_GUN') projSpeed = 15;
        else if (type === 'BAZOOKA') { projSpeed = 12; projType = 'BAZOOKA'; }
        else if (type === 'CANNON') { projSpeed = 20; projType = 'CANNON'; }
        else if (type === 'RIFLE' && part.spec.range === 'LONG') projSpeed = 25;

        const precision = build.stats.precision || 100;
        const maxSpread = type === 'MACHINE_GUN' ? 0.35 : 0.2; 
        const accuracyFactor = Math.min(1, Math.max(0, (precision - 50) / 150)); 
        const currentSpread = maxSpread * (1 - accuracyFactor);
        const randomSpread = (this.rng.next() - 0.5) * currentSpread;

        const baseAngle = mech.rotation;
        const fireAngle = baseAngle + randomSpread;
        
        // Use resolved visual color or fallback
        const projColor = mech.visualConfig?.baseColor || (mech.id === 'PLAYER' ? '#22d3ee' : '#ef4444');

        this.projectiles.push({
            id: `p_${mech.id}_${slot}_${this.currentTick}_${this.rng.next()}`,
            ownerId: mech.id,
            position: { ...mech.position },
            velocity: { 
                x: Math.cos(fireAngle) * (isMissile ? 5 : projSpeed), 
                y: Math.sin(fireAngle) * (isMissile ? 5 : projSpeed) 
            },
            damage: dmg,
            impact: impact, // Attach impact value
            color: projColor,
            type: isMissile ? 'MISSILE' : projType as any,
            guidance: isMissile ? 0.15 : 0, 
            targetId: target.id
        });
    }

    updateProjectiles(events: BattleEvent[]) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            if (p.type === 'MISSILE' && p.targetId && p.guidance) {
                const targetState = p.targetId === 'PLAYER' ? this.playerState : this.enemyState;
                const angle = angleTo(p.position, targetState.position);
                const currentAngle = Math.atan2(p.velocity.y, p.velocity.x);
                let diff = angle - currentAngle;
                while (diff <= -Math.PI) diff += Math.PI*2;
                while (diff > Math.PI) diff -= Math.PI*2;
                
                const turn = Math.max(-p.guidance, Math.min(p.guidance, diff));
                const speed = Math.sqrt(p.velocity.x**2 + p.velocity.y**2) * 1.05; 
                
                const newAngle = currentAngle + turn;
                p.velocity.x = Math.cos(newAngle) * Math.min(speed, 20);
                p.velocity.y = Math.sin(newAngle) * Math.min(speed, 20);
            }
            
            const nextX = p.position.x + p.velocity.x;
            const nextY = p.position.y + p.velocity.y;
            
            let hitObstacle = false;
            for (const obs of this.obstacles) {
                if (intersectLineRect(p.position.x, p.position.y, nextX, nextY, obs.x, obs.y, obs.width, obs.height)) {
                    hitObstacle = true;
                    break;
                }
            }

            if (hitObstacle || nextX < 0 || nextX > ARENA_SIZE.width || nextY < 0 || nextY > ARENA_SIZE.height) {
                events.push({ type: 'WALL_COLLISION', location: { x: nextX, y: nextY } });
                this.projectiles.splice(i, 1);
                continue;
            }

            p.position.x = nextX;
            p.position.y = nextY;

            const target = p.ownerId === 'PLAYER' ? this.enemyState : this.playerState;
            if (dist(p.position, target.position) < MECH_RADIUS + 5) {
                events.push({ type: 'HIT', sourceId: p.ownerId, targetId: target.id, damage: p.damage, location: { ...p.position } });
                this.applyDamage(target, p.damage, p.impact || p.damage * 0.5, events);
                this.projectiles.splice(i, 1);
            }
        }
    }

    applyDamage(target: MechBattleState, damage: number, impact: number, events: BattleEvent[]) {
        let finalDamage = damage;
        let finalImpact = impact;

        if (target.isShielded) {
             finalDamage *= 0.3; 
             finalImpact *= 0.2; // Shield absorbs impact too
             target.energy -= damage * 0.5; 
             events.push({ type: 'SHIELD_BLOCK', location: { ...target.position } });
        }
        
        // Direct Hit Bonus (Staggered take extra dmg)
        if (target.isStaggered) {
            finalDamage *= 1.5;
        }

        const build = target.id === 'PLAYER' ? this.playerBuild : this.enemyBuild;
        const defense = build.stats.defense || 0;
        finalDamage = Math.max(1, finalDamage - (defense / 20));
        
        target.hp -= finalDamage;
        if (target.hp <= 0) {
            target.hp = 0;
            events.push({ type: 'DESTROYED', targetId: target.id, location: { ...target.position } });
        }

        // Apply Stability Damage
        if (!target.isStaggered && target.hp > 0) {
            target.stability -= finalImpact;
            if (target.stability <= 0) {
                target.stability = 0;
                target.isStaggered = true;
                target.staggerTimer = 90; // 1.5 seconds stagger
                events.push({ type: 'STAGGER_BREAK', targetId: target.id, location: { ...target.position } });
            }
        }
    }

    updateResources(mech: MechBattleState, build: MechBuild) {
        const netOutput = build.stats.energyOutput - build.stats.energyDrain;
        const regen = netOutput / TICKS_PER_SECOND;

        if (mech.energy < mech.maxEnergy) {
            mech.energy += regen;
            if (mech.energy > mech.maxEnergy) mech.energy = mech.maxEnergy;
        }

        if (mech.heat > 0) {
            mech.heat -= build.stats.cooling / 120;
            if (mech.heat < 0) mech.heat = 0;
        }

        const overheatThreshold = build.stats.heatCapacity || 3000;
        if (!mech.isOverheated && mech.heat > overheatThreshold) mech.isOverheated = true;
        else if (mech.isOverheated && mech.heat < overheatThreshold * 0.6) mech.isOverheated = false;
    }
}

export default BattleEngine;
