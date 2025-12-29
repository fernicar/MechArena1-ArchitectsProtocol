
import { MechBuild, Rival, PartCategory, MechPart } from '../types';
import { DEFAULT_PARTS, calculateStats, MECH_COLORS, PAINT_PATTERNS } from '../constants';

const getEmptyPart = (category: PartCategory): MechPart => {
    // Try to find an existing NONE part
    const existing = DEFAULT_PARTS.find(p => p.category === category && p.name === 'NONE');
    if (existing) return existing;
    
    // Synthetic empty part
    return {
        id: `empty_${category}_${Math.random().toString(36).substr(2, 9)}`,
        name: 'NONE',
        description: 'Empty Slot',
        category: category,
        cost: 0,
        unlockLevel: 0,
        stats: { weight: 0, energyDrain: 0, firepower: 0, ammo: 0 }
    };
};

const getRandomPart = (category: PartCategory, minLevel: number, maxLevel: number): MechPart => {
    const valid = DEFAULT_PARTS.filter(p => p.category === category && p.unlockLevel >= minLevel && p.unlockLevel <= maxLevel);
    if (valid.length > 0) {
        return valid[Math.floor(Math.random() * valid.length)];
    }
    
    // Fallback to any part of that category
    const anyPart = DEFAULT_PARTS.find(p => p.category === category);
    if (anyPart) return anyPart;

    // Fallback to empty if absolutely nothing found (prevents crash)
    return getEmptyPart(category);
};

export const generateRivalBuild = (rival: Rival): MechBuild => {
    // Difficulty scaling based on rating
    // Rating 800 (E) -> Level 1-5 parts
    // Rating 2500 (S) -> Level 10-25 parts
    const levelFactor = Math.max(1, Math.min(25, Math.floor((rival.rating - 800) / 80)));
    const minLvl = Math.max(1, levelFactor - 5);
    
    // Helper to try building valid mech
    let attempts = 0;
    while (attempts < 10) {
        const parts: any = {};
        
        // Essential Parts
        parts[PartCategory.HEAD] = getRandomPart(PartCategory.HEAD, minLvl, levelFactor);
        parts[PartCategory.CORE] = getRandomPart(PartCategory.CORE, minLvl, levelFactor);
        parts[PartCategory.ARMS] = getRandomPart(PartCategory.ARMS, minLvl, levelFactor);
        parts[PartCategory.LEGS] = getRandomPart(PartCategory.LEGS, minLvl, levelFactor);
        parts[PartCategory.FCS] = getRandomPart(PartCategory.FCS, minLvl, levelFactor);
        
        // Generator/Radiator/Booster - try to pick higher tier to ensure stable build
        parts[PartCategory.GENERATOR] = getRandomPart(PartCategory.GENERATOR, Math.max(1, levelFactor-2), levelFactor + 2) || getRandomPart(PartCategory.GENERATOR, 1, 25);
        parts[PartCategory.RADIATOR] = getRandomPart(PartCategory.RADIATOR, Math.max(1, levelFactor-2), levelFactor + 2) || getRandomPart(PartCategory.RADIATOR, 1, 25);
        parts[PartCategory.BOOSTER] = getRandomPart(PartCategory.BOOSTER, minLvl, levelFactor);

        // Weapons
        parts[PartCategory.WEAPON_R] = getRandomPart(PartCategory.WEAPON_R, 1, levelFactor);
        parts[PartCategory.WEAPON_L] = getRandomPart(PartCategory.WEAPON_L, 1, levelFactor);
        
        // Back units (random chance to be empty)
        parts[PartCategory.BACK_L] = Math.random() > 0.3 ? getRandomPart(PartCategory.BACK_L, 1, levelFactor) : getEmptyPart(PartCategory.BACK_L);
        parts[PartCategory.BACK_R] = Math.random() > 0.3 ? getRandomPart(PartCategory.BACK_R, 1, levelFactor) : getEmptyPart(PartCategory.BACK_R);

        // AI
        const aiConfig = {
            mode: 'SLIDERS' as const,
            sliders: {
                aggression: 20 + Math.random() * 80,
                caution: 20 + Math.random() * 80,
                mobility: 20 + Math.random() * 80,
                focus: 20 + Math.random() * 80,
                energySave: 20 + Math.random() * 80,
            },
            treeNodes: []
        };

        const stats = calculateStats(parts, aiConfig);

        // Validation
        const validWeight = stats.weight <= stats.weightCapacity;
        const validEnergy = stats.energyDrain <= stats.energyOutput;

        if (validWeight && validEnergy) {
            // Cosmetics
            const primary = MECH_COLORS[Math.floor(Math.random() * MECH_COLORS.length)].id;
            const secondary = MECH_COLORS[Math.floor(Math.random() * MECH_COLORS.length)].id;
            const pattern = PAINT_PATTERNS[Math.floor(Math.random() * PAINT_PATTERNS.length)].id as any;

            return {
                id: `build_${rival.id}`,
                name: rival.mechName,
                cosmetics: { primary, secondary, pattern },
                parts: parts,
                aiConfig,
                stats
            };
        }
        attempts++;
    }

    // Fallback if procedural generation fails repeatedly (should be rare with loose constraints)
    // Return a basic starter build with name override
    const fallback = JSON.parse(JSON.stringify(require('../constants').STARTER_BUILD));
    fallback.name = rival.mechName;
    return fallback;
};
