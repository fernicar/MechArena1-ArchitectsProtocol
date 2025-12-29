
import { PartCategory, MechPart, AIChip } from '../types';

export const DEFAULT_PARTS: MechPart[] = [
  // HEADS - Provide AI Capacity
  {
    id: 'h_01', name: 'HD-BASIC', description: 'Standard reliable head unit.', category: PartCategory.HEAD, cost: 0, unlockLevel: 1,
    stats: { ap: 800, weight: 150, energyDrain: 100, defense: 100, scanRange: 300, aiCapacity: 100 }
  },
  {
    id: 'h_02', name: 'HD-SCANNER', description: 'Enhanced sensor array.', category: PartCategory.HEAD, cost: 4000, unlockLevel: 5,
    stats: { ap: 600, weight: 120, energyDrain: 150, defense: 80, scanRange: 600, aiCapacity: 150 }
  },
  {
    id: 'h_03', name: 'HD-COMBAT', description: 'Heavily armored combat head.', category: PartCategory.HEAD, cost: 8500, unlockLevel: 10,
    stats: { ap: 1200, weight: 250, energyDrain: 120, defense: 150, scanRange: 250, aiCapacity: 80 }
  },
  {
    id: 'h_04', name: 'HD-ZERO', description: 'Experimental AI prototype head.', category: PartCategory.HEAD, cost: 25000, unlockLevel: 20,
    stats: { ap: 900, weight: 180, energyDrain: 400, defense: 90, scanRange: 800, aiCapacity: 250 }
  },

  // CORES
  {
    id: 'c_01', name: 'CR-STD', description: 'Balanced core unit.', category: PartCategory.CORE, cost: 0, unlockLevel: 1,
    stats: { ap: 2500, weight: 1200, energyDrain: 200, defense: 500, heatCapacity: 1000 }
  },
  {
    id: 'c_02', name: 'CR-LIGHT', description: 'Lightweight for speed.', category: PartCategory.CORE, cost: 12000, unlockLevel: 5,
    stats: { ap: 1800, weight: 800, energyDrain: 150, defense: 300, mobility: 50, heatCapacity: 800 }
  },
  {
    id: 'c_03', name: 'CR-HEAVY', description: 'Heavy plating core.', category: PartCategory.CORE, cost: 15000, unlockLevel: 10,
    stats: { ap: 4000, weight: 2000, energyDrain: 300, defense: 800, mobility: -50, heatCapacity: 1500 }
  },

  // ARMS - Provide Precision
  {
    id: 'a_01', name: 'AM-STD', description: 'Standard manipulators.', category: PartCategory.ARMS, cost: 0, unlockLevel: 1,
    stats: { ap: 1500, weight: 800, energyDrain: 150, defense: 300, firepower: 50, precision: 100 }
  },
  {
    id: 'a_02', name: 'AM-FIRE', description: 'Enhanced fire control.', category: PartCategory.ARMS, cost: 9000, unlockLevel: 5,
    stats: { ap: 1200, weight: 700, energyDrain: 180, defense: 200, firepower: 200, precision: 150 }
  },
  {
    id: 'a_03', name: 'AM-STABLE', description: 'Recoil dampening arms.', category: PartCategory.ARMS, cost: 14000, unlockLevel: 12,
    stats: { ap: 2000, weight: 1200, energyDrain: 250, defense: 400, firepower: 100, precision: 200 }
  },

  // LEGS
  {
    id: 'l_01', name: 'LG-BIPED', description: 'Standard bipedal legs.', category: PartCategory.LEGS, cost: 0, unlockLevel: 1,
    spec: { legType: 'BIPED' },
    stats: { ap: 3000, weight: 1500, weightCapacity: 8000, energyDrain: 300, defense: 400, mobility: 300 }
  },
  {
    id: 'l_02', name: 'LG-REV', description: 'Reverse joint for jumping.', category: PartCategory.LEGS, cost: 11000, unlockLevel: 5,
    spec: { legType: 'REVERSE_JOINT' },
    stats: { ap: 2200, weight: 1200, weightCapacity: 6500, energyDrain: 250, defense: 300, mobility: 600 }
  },
  {
    id: 'l_03', name: 'LG-TANK', description: 'Caterpillar treads.', category: PartCategory.LEGS, cost: 18000, unlockLevel: 10,
    spec: { legType: 'TANK' },
    stats: { ap: 5000, weight: 3500, weightCapacity: 12000, energyDrain: 500, defense: 800, mobility: 50 }
  },
  {
    id: 'l_04', name: 'LG-QUAD', description: 'Quadruped legs for stability.', category: PartCategory.LEGS, cost: 22000, unlockLevel: 15,
    spec: { legType: 'QUAD' },
    stats: { ap: 3500, weight: 2000, weightCapacity: 9500, energyDrain: 400, defense: 500, mobility: 400 }
  },
  {
    id: 'l_05', name: 'LG-HOVER', description: 'High speed hover legs.', category: PartCategory.LEGS, cost: 28000, unlockLevel: 20,
    spec: { legType: 'HOVER' },
    stats: { ap: 2500, weight: 1800, weightCapacity: 8500, energyDrain: 600, defense: 350, mobility: 800 }
  },

  // GENERATOR
  {
    id: 'g_01', name: 'GN-STD', description: 'Standard output generator.', category: PartCategory.GENERATOR, cost: 0, unlockLevel: 1,
    stats: { weight: 500, energyOutput: 3000, energyCapacity: 5000 }
  },
  {
    id: 'g_02', name: 'GN-HI-OUT', description: 'High output generator.', category: PartCategory.GENERATOR, cost: 14000, unlockLevel: 8,
    stats: { weight: 900, energyOutput: 4500, energyCapacity: 6000 }
  },
  {
    id: 'g_03', name: 'GN-LITE', description: 'Lightweight generator.', category: PartCategory.GENERATOR, cost: 10000, unlockLevel: 5,
    stats: { weight: 300, energyOutput: 2800, energyCapacity: 4000 }
  },

  // RADIATOR
  {
    id: 'rad_01', name: 'RAD-STD', description: 'Standard cooling system.', category: PartCategory.RADIATOR, cost: 0, unlockLevel: 1,
    stats: { weight: 200, cooling: 1000, energyDrain: 50, heatCapacity: 2000 }
  },
  {
    id: 'rad_02', name: 'RAD-ICE', description: 'High efficiency cooling.', category: PartCategory.RADIATOR, cost: 8000, unlockLevel: 8,
    stats: { weight: 350, cooling: 2000, energyDrain: 120, heatCapacity: 3000 }
  },

  // BOOSTER
  {
    id: 'bst_01', name: 'BST-STD', description: 'Standard lateral thrusters.', category: PartCategory.BOOSTER, cost: 0, unlockLevel: 1,
    stats: { weight: 300, mobility: 200, energyDrain: 200 }
  },
  {
    id: 'bst_02', name: 'BST-V2', description: 'High power combat boosters.', category: PartCategory.BOOSTER, cost: 12000, unlockLevel: 8,
    stats: { weight: 500, mobility: 500, energyDrain: 600 }
  },
  {
    id: 'bst_03', name: 'BST-ECO', description: 'Fuel efficient boosters.', category: PartCategory.BOOSTER, cost: 9000, unlockLevel: 5,
    stats: { weight: 250, mobility: 150, energyDrain: 100 }
  },

  // FCS
  {
    id: 'f_01', name: 'FCS-STD', description: 'Standard lock-on.', category: PartCategory.FCS, cost: 0, unlockLevel: 1,
    stats: { weight: 50, energyDrain: 20, scanRange: 100, precision: 20 }
  },
  {
    id: 'f_02', name: 'FCS-LONG', description: 'Long range targeting.', category: PartCategory.FCS, cost: 7000, unlockLevel: 8,
    stats: { weight: 80, energyDrain: 40, scanRange: 300, precision: 50 }
  },

  // WEAPONS
  // Rebalanced: MG dmg down/ammo up. Sniper dmg up/ammo down.
  {
    id: 'w_r_01', name: 'RIFLE-X1', description: 'Assault Rifle.', category: PartCategory.WEAPON_R, cost: 0, unlockLevel: 1,
    spec: { weaponType: 'RIFLE', range: 'MEDIUM' },
    stats: { weight: 400, energyDrain: 10, firepower: 350, ammo: 180 }
  },
  {
    id: 'w_r_02', name: 'MG-HURRICANE', description: 'Rapid fire Machine Gun.', category: PartCategory.WEAPON_R, cost: 6500, unlockLevel: 5,
    spec: { weaponType: 'MACHINE_GUN', range: 'SHORT' },
    stats: { weight: 500, energyDrain: 20, firepower: 45, ammo: 800 } // Low dmg, high fire rate
  },
  {
    id: 'w_r_03', name: 'BAZOOKA-X', description: 'Heavy Bazooka.', category: PartCategory.WEAPON_R, cost: 12000, unlockLevel: 10,
    spec: { weaponType: 'BAZOOKA', range: 'MEDIUM' },
    stats: { weight: 1200, energyDrain: 50, firepower: 1500, ammo: 40 }
  },
  {
    id: 'w_r_04', name: 'SNIPER-L8', description: 'Long range rifle.', category: PartCategory.WEAPON_R, cost: 18000, unlockLevel: 15,
    spec: { weaponType: 'RIFLE', range: 'LONG' },
    stats: { weight: 800, energyDrain: 80, firepower: 1200, ammo: 30, precision: 150 }
  },
  {
    id: 'w_r_05', name: 'SHOTGUN-S', description: 'Close quarters spread.', category: PartCategory.WEAPON_R, cost: 15000, unlockLevel: 12,
    spec: { weaponType: 'RIFLE', range: 'SHORT' },
    stats: { weight: 600, energyDrain: 30, firepower: 600, ammo: 60 }
  },

  {
    id: 'w_l_01', name: 'BLADE-Z', description: 'Laser Blade.', category: PartCategory.WEAPON_L, cost: 0, unlockLevel: 1,
    spec: { weaponType: 'BLADE', range: 'SHORT' },
    stats: { weight: 200, energyDrain: 150, firepower: 800, ammo: 999 } 
  },
  {
    id: 'w_l_02', name: 'SHIELD-E', description: 'Energy Shield.', category: PartCategory.WEAPON_L, cost: 5000, unlockLevel: 5,
    spec: { weaponType: 'SHIELD' },
    stats: { weight: 400, energyDrain: 300, defense: 500, ammo: 999 }
  },
  {
    id: 'w_l_03', name: 'PILE-BUNKER', description: 'Explosive spike driver.', category: PartCategory.WEAPON_L, cost: 16000, unlockLevel: 15,
    spec: { weaponType: 'BLADE', range: 'SHORT' },
    stats: { weight: 900, energyDrain: 50, firepower: 3500, ammo: 20 }
  },

  {
    id: 'w_b_l_01', name: 'MISSILE-4', description: '4-cell missile launcher.', category: PartCategory.BACK_L, cost: 0, unlockLevel: 1,
    spec: { weaponType: 'MISSILE', range: 'LONG' },
    stats: { weight: 600, energyDrain: 50, firepower: 600, ammo: 30 }
  },
  {
    id: 'w_b_l_02', name: 'CANNON-S', description: 'Back-mounted Cannon.', category: PartCategory.BACK_L, cost: 9000, unlockLevel: 10,
    spec: { weaponType: 'CANNON', range: 'LONG' },
    stats: { weight: 1000, energyDrain: 100, firepower: 1200, ammo: 20 }
  },
  
  {
    id: 'w_b_r_01', name: 'NONE', description: 'Empty Slot', category: PartCategory.BACK_R, cost: 0, unlockLevel: 1,
    stats: { weight: 0, energyDrain: 0, firepower: 0, ammo: 0 }
  },
  {
    id: 'w_b_r_02', name: 'RADAR-X', description: 'Back-mounted radar.', category: PartCategory.BACK_R, cost: 4000, unlockLevel: 5,
    spec: { weaponType: 'RADAR' },
    stats: { weight: 300, energyDrain: 80, scanRange: 500, ammo: 0 }
  },
  {
    id: 'w_b_r_03', name: 'MISSILE-6', description: '6-cell missile launcher.', category: PartCategory.BACK_R, cost: 7500, unlockLevel: 10,
    spec: { weaponType: 'MISSILE', range: 'LONG' },
    stats: { weight: 800, energyDrain: 60, firepower: 900, ammo: 24 }
  },
  {
    id: 'w_b_r_04', name: 'VT-MISSILE', description: 'Vertical launch missiles.', category: PartCategory.BACK_R, cost: 15000, unlockLevel: 18,
    spec: { weaponType: 'MISSILE', range: 'LONG' },
    stats: { weight: 1100, energyDrain: 100, firepower: 1200, ammo: 18 }
  },
];

export const AI_CHIPS: AIChip[] = [
    {
        id: 'chip_balanced',
        name: 'STANDARD',
        description: 'Factory default combat logic.',
        icon: '⚙️',
        cost: 40,
        unlockLevel: 1,
        config: {
            mode: 'SLIDERS',
            sliders: { aggression: 50, caution: 50, mobility: 50, focus: 50, energySave: 50 },
            treeNodes: []
        }
    },
    {
        id: 'chip_saver',
        name: 'ECO MODE',
        description: 'Max energy efficiency.',
        icon: '🔋',
        cost: 40,
        unlockLevel: 1,
        config: {
            mode: 'SLIDERS',
            sliders: { aggression: 40, caution: 60, mobility: 40, focus: 50, energySave: 100 },
            treeNodes: []
        }
    },
    {
        id: 'chip_berserker',
        name: 'BERSERKER',
        description: 'Close range aggression. Ignores safety.',
        icon: '⚔️',
        cost: 60,
        unlockLevel: 1,
        config: {
            mode: 'SLIDERS',
            sliders: { aggression: 100, caution: 0, mobility: 100, focus: 80, energySave: 0 },
            treeNodes: []
        }
    },
    {
        id: 'chip_brawler',
        name: 'BRAWLER',
        description: 'Mid-range with mobility bursts.',
        icon: '🥊',
        cost: 65,
        unlockLevel: 5,
        config: {
            mode: 'SLIDERS',
            sliders: { aggression: 70, caution: 30, mobility: 80, focus: 60, energySave: 40 },
            treeNodes: []
        }
    },
    {
        id: 'chip_suppression',
        name: 'SUPPRESSION',
        description: 'Continuous fire. Low mobility.',
        icon: '🔥',
        cost: 55,
        unlockLevel: 5,
        config: {
            mode: 'SLIDERS',
            sliders: { aggression: 60, caution: 40, mobility: 20, focus: 30, energySave: 40 },
            treeNodes: []
        }
    },
    {
        id: 'chip_denial',
        name: 'DENIAL',
        description: 'Control the battlefield.',
        icon: '🚧',
        cost: 75,
        unlockLevel: 5,
        config: {
            mode: 'SLIDERS',
            sliders: { aggression: 40, caution: 60, mobility: 30, focus: 70, energySave: 60 },
            treeNodes: []
        }
    },
    {
        id: 'chip_sniper',
        name: 'EAGLE EYE',
        description: 'Maintains distance. High focus.',
        icon: '🎯',
        cost: 60,
        unlockLevel: 10,
        config: {
            mode: 'SLIDERS',
            sliders: { aggression: 0, caution: 100, mobility: 40, focus: 100, energySave: 60 },
            treeNodes: []
        }
    },
    {
        id: 'chip_skirmisher',
        name: 'GALE FORCE',
        description: 'Hit-and-run tactics.',
        icon: '💨',
        cost: 70,
        unlockLevel: 10,
        config: {
            mode: 'SLIDERS',
            sliders: { aggression: 60, caution: 70, mobility: 100, focus: 40, energySave: 30 },
            treeNodes: []
        }
    },
    {
        id: 'chip_focus',
        name: 'FOCUS',
        description: 'Tunnel vision on target.',
        icon: '👁️',
        cost: 60,
        unlockLevel: 10,
        config: {
            mode: 'SLIDERS',
            sliders: { aggression: 80, caution: 20, mobility: 60, focus: 100, energySave: 50 },
            treeNodes: []
        }
    },
    {
        id: 'chip_turtle',
        name: 'IRON SHELL',
        description: 'Defensive. Prioritizes survival.',
        icon: '🛡️',
        cost: 50,
        unlockLevel: 15,
        config: {
            mode: 'SLIDERS',
            sliders: { aggression: 20, caution: 100, mobility: 20, focus: 50, energySave: 90 },
            treeNodes: []
        }
    },
    {
        id: 'chip_evasive',
        name: 'PHANTOM',
        description: 'Prioritizes evasion.',
        icon: '👻',
        cost: 80,
        unlockLevel: 15,
        config: {
            mode: 'SLIDERS',
            sliders: { aggression: 30, caution: 90, mobility: 100, focus: 50, energySave: 20 },
            treeNodes: []
        }
    },
    {
        id: 'chip_glass',
        name: 'GLASSCANNON',
        description: 'High risk, high reward.',
        icon: '💣',
        cost: 90,
        unlockLevel: 20,
        config: {
            mode: 'SLIDERS',
            sliders: { aggression: 100, caution: 0, mobility: 80, focus: 90, energySave: 10 },
            treeNodes: []
        }
    }
];
