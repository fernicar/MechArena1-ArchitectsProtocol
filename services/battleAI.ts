
import { MechBattleState, MechBuild, BattleEvent, BehaviorNode, Obstacle, PartCategory } from '../types';
import { AI_CHIPS } from '../data/items';
import { RNG, dist, angleTo, intersectLineRect } from '../utils/battleMath';

const TICKS_PER_SECOND = 60;

export const processAI = (
    mech: MechBattleState, 
    build: MechBuild, 
    target: MechBattleState, 
    events: BattleEvent[], 
    obstacles: Obstacle[], 
    currentTick: number, 
    rng: RNG
) => {
    // If overheated, force cooling behavior (cannot act)
    if (mech.isOverheated) {
        mech.isBoosting = false;
        mech.isFiringR = false;
        mech.isFiringL = false;
        mech.isFiringBackL = false;
        mech.isFiringBackR = false;
        const angle = angleTo(mech.position, target.position);
        mech.targetRotation = angle;
        if (rng.next() < 0.01) {
            events.push({ type: 'AI_DECISION', sourceId: mech.id, message: 'SYSTEM OVERHEAT - COOLING' });
        }
        return;
    }

    const activeConfig = build.aiConfig.mode === 'CHIP' && build.aiConfig.activeChipId
        ? AI_CHIPS.find(c => c.id === build.aiConfig.activeChipId)?.config || build.aiConfig
        : build.aiConfig;

    let actionTaken = false;

    if (activeConfig.mode === 'TREE' && activeConfig.treeNodes && activeConfig.treeNodes.length > 0) {
        const root = activeConfig.treeNodes.find(n => n.type === 'ROOT');
        if (root) {
            // Reset flags before tree evaluation
            mech.isFiringR = false; mech.isFiringL = false;
            mech.isFiringBackL = false; mech.isFiringBackR = false;
            mech.isBoosting = false;
            actionTaken = evaluateNode(root, activeConfig.treeNodes, mech, target, events, obstacles, currentTick, rng);
        }
    } 
    
    if (!actionTaken) {
        processSliderAI(mech, build, target, activeConfig.sliders || build.aiConfig.sliders, events, obstacles, rng);
    }
};

const evaluateNode = (
    node: BehaviorNode, 
    allNodes: BehaviorNode[], 
    mech: MechBattleState, 
    target: MechBattleState, 
    events: BattleEvent[], 
    obstacles: Obstacle[], 
    currentTick: number,
    rng: RNG
): boolean => {
    switch (node.type) {
        case 'ROOT':
        case 'SELECTOR':
            for (const childId of node.children) {
                const child = allNodes.find(n => n.id === childId);
                if (child && evaluateNode(child, allNodes, mech, target, events, obstacles, currentTick, rng)) return true;
            }
            return false;
        case 'SEQUENCE':
            for (const childId of node.children) {
                const child = allNodes.find(n => n.id === childId);
                if (child && !evaluateNode(child, allNodes, mech, target, events, obstacles, currentTick, rng)) return false;
            }
            return true;
        case 'CONDITION': return checkCondition(node, mech, target, obstacles, currentTick);
        case 'ACTION': 
            const result = executeAction(node, mech, target, obstacles);
            if (result && rng.next() < 0.02) {
                events.push({ type: 'AI_DECISION', sourceId: mech.id, message: `EXEC: ${node.label}` });
            }
            return result;
        default: return false;
    }
};

const checkCondition = (node: BehaviorNode, mech: MechBattleState, target: MechBattleState, obstacles: Obstacle[], currentTick: number): boolean => {
    const cond = node.config?.condition;
    const param = parseFloat(node.config?.param || '0');
    const d = dist(mech.position, target.position);
    
    const hasLoS = checkLineOfSight(mech.position, target.position, obstacles);

    switch (cond) {
        case 'range_less': return d < param;
        case 'range_more': return d > param;
        case 'hp_less': return (mech.hp / mech.maxHp) * 100 < param;
        case 'hp_more': return (mech.hp / mech.maxHp) * 100 > param;
        case 'energy_less': return (mech.energy / mech.maxEnergy) * 100 < param;
        case 'stability_less': return (mech.stability / mech.maxStability) * 100 < param;
        case 'enemy_staggered': return target.isStaggered;
        case 'ammo_less':
            const totalMax = mech.maxWeaponRAmmo + mech.maxWeaponLAmmo + mech.maxBackLAmmo + mech.maxBackRAmmo;
            const totalCur = mech.weaponRAmmo + mech.weaponLAmmo + mech.backLAmmo + mech.backRAmmo;
            return totalMax > 0 ? (totalCur / totalMax) * 100 < param : true;
        case 'time_elapsed': return (currentTick / TICKS_PER_SECOND) > param;
        case 'visible': return hasLoS;
        case 'cover_available': return obstacles.some(o => dist(mech.position, { x: o.x + o.width/2, y: o.y + o.height/2 }) < 150);
        case 'enemy_count': return true;
        default: return false;
    }
};

const executeAction = (node: BehaviorNode, mech: MechBattleState, target: MechBattleState, obstacles: Obstacle[]): boolean => {
    const action = node.config?.action;
    const angle = angleTo(mech.position, target.position);
    mech.targetRotation = angle;
    const hasLoS = checkLineOfSight(mech.position, target.position, obstacles);

    switch (action) {
        case 'attack_right': if (hasLoS) mech.isFiringR = true; return true;
        case 'attack_left': if (hasLoS) mech.isFiringL = true; return true;
        case 'fire_all': 
            if (hasLoS) {
                mech.isFiringR = true; mech.isFiringL = true; 
                mech.isFiringBackL = true; mech.isFiringBackR = true;
            }
            return true;
        case 'move_forward':
            mech.velocity.x += Math.cos(angle) * 0.5;
            mech.velocity.y += Math.sin(angle) * 0.5;
            mech.isBoosting = true;
            return true;
        case 'retreat':
            mech.velocity.x -= Math.cos(angle) * 0.5;
            mech.velocity.y -= Math.sin(angle) * 0.5;
            mech.isBoosting = true;
            return true;
        case 'strafe_left':
            mech.velocity.x += Math.cos(angle - Math.PI/2) * 0.5;
            mech.velocity.y += Math.sin(angle - Math.PI/2) * 0.5;
            mech.isBoosting = true;
            return true;
        case 'strafe_right':
            mech.velocity.x += Math.cos(angle + Math.PI/2) * 0.5;
            mech.velocity.y += Math.sin(angle + Math.PI/2) * 0.5;
            mech.isBoosting = true;
            return true;
        case 'boost_dash':
            mech.velocity.x += Math.cos(mech.rotation) * 1.0;
            mech.velocity.y += Math.sin(mech.rotation) * 1.0;
            mech.isBoosting = true;
            return true;
        case 'take_cover':
            let nearestObs = null;
            let minDst = Infinity;
            for(const obs of obstacles) {
                const d = dist(mech.position, {x: obs.x + obs.width/2, y: obs.y + obs.height/2});
                if(d < minDst) {
                    minDst = d;
                    nearestObs = obs;
                }
            }
            
            if (nearestObs) {
                const obsCenter = {x: nearestObs.x + nearestObs.width/2, y: nearestObs.y + nearestObs.height/2};
                const angleTtoO = angleTo(target.position, obsCenter);
                const targetDist = 120;
                const dest = {
                    x: obsCenter.x + Math.cos(angleTtoO) * targetDist,
                    y: obsCenter.y + Math.sin(angleTtoO) * targetDist
                };
                
                const angleToDest = angleTo(mech.position, dest);
                mech.velocity.x += Math.cos(angleToDest) * 0.8;
                mech.velocity.y += Math.sin(angleToDest) * 0.8;
                mech.isBoosting = true;
                mech.targetRotation = angleToDest;
                return true;
            }
            return false;
        default: return true;
    }
};

const processSliderAI = (mech: MechBattleState, build: MechBuild, target: MechBattleState, sliders: any, events: BattleEvent[], obstacles: Obstacle[], rng: RNG) => {
    const distance = dist(mech.position, target.position);
    const angle = angleTo(mech.position, target.position);
    
    mech.targetRotation = angle;
    
    // --- AMMO CHECK & TACTICAL SHIFT ---
    const primaryAmmo = mech.weaponRAmmo;
    const secondaryAmmo = mech.weaponLAmmo;
    const backAmmo = mech.backLAmmo + mech.backRAmmo;
    
    const isPrimaryDry = primaryAmmo <= 0;
    const isSecondaryDry = secondaryAmmo <= 0;
    const isTotalDry = isPrimaryDry && isSecondaryDry && backAmmo <= 0;

    // Determine Optimal Range based on equipped weapons AND ammo status
    let optimalRange = 400; // Default mid range
    const wR = build.parts[PartCategory.WEAPON_R].spec?.range;
    const wL = build.parts[PartCategory.WEAPON_L].spec?.range;
    
    // If melee weapon available and primary is dry, force close range
    const hasMelee = build.parts[PartCategory.WEAPON_L].spec?.weaponType === 'BLADE' || build.parts[PartCategory.WEAPON_L].spec?.weaponType === 'SHIELD';
    
    if (isTotalDry) {
        // RAMMING MODE
        optimalRange = 0;
    } else if (isPrimaryDry && hasMelee) {
        // Switch to Melee priority
        optimalRange = 50;
    } else {
        if (wR === 'SHORT' || wL === 'SHORT') optimalRange = 150;
        if (wR === 'LONG' || wL === 'LONG') optimalRange = 600;
    }

    // Aggression slider modifies preferred range
    // High aggression = closer, Low aggression = further
    let desiredRange = optimalRange - ((sliders.aggression - 50) * 4);
    desiredRange = Math.max(0, desiredRange); // Clamp min range (0 for ramming)

    const hasLoS = checkLineOfSight(mech.position, target.position, obstacles);
    const moveSpeed = (build.stats.mobility / 1000) * 2;
    
    // Energy Management Check
    const energyThreshold = (sliders.energySave / 100) * 0.8; // 0 to 0.8 max energy
    const lowEnergy = (mech.energy / mech.maxEnergy) < energyThreshold;
    const canBoost = !lowEnergy;

    let movementState = 'IDLE';

    // *** STABILITY REACTIVITY ***
    const selfStability = mech.stability / mech.maxStability;
    const stabilityCritical = selfStability < 0.3; // Under 30% ACS
    
    // Default movement logic
    let shouldRetreat = (distance < desiredRange - 50);
    let shouldAdvance = (distance > desiredRange + 100);
    let shouldStrafe = false;

    // React to Enemy Stagger (Opportunity)
    if (target.isStaggered) {
        movementState = 'EXECUTING';
        shouldAdvance = true; // Rush in
        shouldRetreat = false;
        // Boost aggressively to capitalize
        if (canBoost) mech.isBoosting = true;
    } 
    // React to Own Instability (Danger)
    else if (stabilityCritical && !target.isStaggered && !isTotalDry) {
        movementState = 'STABILIZING';
        shouldRetreat = true; // Back off to recover ACS
        shouldAdvance = false;
        // High Mobility slider allows strafing while retreating
        if (sliders.mobility > 50) shouldStrafe = true;
    }
    // Normal Behavior
    else {
        if (!hasLoS && sliders.aggression > 50) {
            movementState = 'HUNTING';
            shouldAdvance = true;
        } else if (rng.next() < sliders.mobility / 1000) {
            shouldStrafe = true;
        }
    }

    // Desperation Override
    if (isTotalDry) {
        movementState = 'RAMMING';
        shouldAdvance = true;
        shouldRetreat = false;
        if (canBoost && distance > 50) mech.isBoosting = true;
    }

    // Apply Velocity
    if (shouldAdvance) {
        mech.velocity.x += Math.cos(mech.rotation) * moveSpeed;
        mech.velocity.y += Math.sin(mech.rotation) * moveSpeed;
        if (canBoost) mech.isBoosting = true;
    } else if (shouldRetreat) {
        mech.velocity.x -= Math.cos(mech.rotation) * moveSpeed;
        mech.velocity.y -= Math.sin(mech.rotation) * moveSpeed;
        if (canBoost) mech.isBoosting = true;
    } 
    
    if (shouldStrafe) {
        movementState = 'STRAFING';
        const strafeDir = rng.next() > 0.5 ? 1 : -1;
        mech.velocity.x += Math.cos(mech.rotation + (Math.PI/2 * strafeDir)) * moveSpeed * 5;
        mech.velocity.y += Math.sin(mech.rotation + (Math.PI/2 * strafeDir)) * moveSpeed * 5;
        // Don't necessarily boost while strafing if saving energy
    }

    if (movementState !== 'IDLE' && rng.next() < 0.005) {
        events.push({ type: 'AI_DECISION', sourceId: mech.id, message: `${movementState} PROTOCOL` });
    }

    // Firing Logic
    const angleDiff = Math.abs(Math.atan2(Math.sin(mech.rotation - angle), Math.cos(mech.rotation - angle)));
    // High Focus slider allows firing even if not perfectly aligned (snap shots) vs needing perfect lock
    const precisionReq = 0.5 - (sliders.focus / 200); 
    const facingTarget = angleDiff < precisionReq;
    const inRange = distance < build.stats.scanRange;

    // Force Fire if Enemy Staggered
    const forceFire = target.isStaggered && hasLoS;

    if ((facingTarget && hasLoS && inRange) || forceFire) {
            // Weapon R Logic
            const wRSpec = build.parts[PartCategory.WEAPON_R].spec;
            if (mech.weaponRAmmo > 0) {
                if (wRSpec?.range === 'SHORT' && distance < 200) mech.isFiringR = true;
                else if (wRSpec?.range !== 'SHORT') mech.isFiringR = true;
            } else {
                mech.isFiringR = false;
            }

            // Weapon L Logic
            if (mech.weaponLAmmo > 0) {
                const wLSpec = build.parts[PartCategory.WEAPON_L].spec;
                if (wLSpec?.weaponType === 'SHIELD') {
                    // Use shield if being fired upon OR if stability is critical
                    if ((rng.next() < sliders.caution / 100) || stabilityCritical) mech.isFiringL = true;
                } else if (wLSpec?.weaponType === 'BLADE') {
                     if (distance < 100 || target.isStaggered) mech.isFiringL = true; // Blade staggered enemies
                } else {
                     mech.isFiringL = true;
                }
            } else {
                mech.isFiringL = false;
            }
            
            // Back Weapons (Heavy use if aggression high OR enemy staggered)
            if (forceFire || (sliders.aggression > 40 && mech.energy > mech.maxEnergy * 0.4)) {
                if (mech.backLAmmo > 0) mech.isFiringBackL = true;
                if (mech.backRAmmo > 0) mech.isFiringBackR = true;
            }
    } else {
            mech.isFiringR = false; mech.isFiringL = false;
            mech.isFiringBackL = false; mech.isFiringBackR = false;
    }
};

const checkLineOfSight = (start: {x:number, y:number}, end: {x:number, y:number}, obstacles: Obstacle[]): boolean => {
    const minX = Math.min(start.x, end.x), maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y), maxY = Math.max(start.y, end.y);

    for (const obs of obstacles) {
        if (maxX < obs.x || minX > obs.x + obs.width || maxY < obs.y || minY > obs.y + obs.height) continue;
        if (obs.type === 'DEBRIS') continue;
        if (intersectLineRect(start.x, start.y, end.x, end.y, obs.x, obs.y, obs.width, obs.height)) {
            return false;
        }
    }
    return true;
};
