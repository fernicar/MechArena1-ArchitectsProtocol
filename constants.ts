
import { PartCategory, EnemyProfile, MechBuild, Tournament } from './types';
import { DEFAULT_PARTS, AI_CHIPS } from './data/items';
import { calculateStats, BASE_STATS } from './utils/stats';

// Re-export for legacy compatibility
export { DEFAULT_PARTS, AI_CHIPS };
export { calculateStats, BASE_STATS };

export const DEBUG_MODE = true; 
export const INITIAL_CREDITS = 50000;

export const MECH_COLORS = [
    { id: 'zinc', hex: '#71717a', name: 'Standard Grey' },
    { id: 'red', hex: '#ef4444', name: 'Crimson' },
    { id: 'blue', hex: '#3b82f6', name: 'Azure' },
    { id: 'green', hex: '#22c55e', name: 'Forest' },
    { id: 'yellow', hex: '#eab308', name: 'Gold' },
    { id: 'purple', hex: '#a855f7', name: 'Royal' },
    { id: 'orange', hex: '#f97316', name: 'Sunset' },
    { id: 'cyan', hex: '#06b6d4', name: 'Neon' },
    { id: 'pink', hex: '#ec4899', name: 'Hot Pink' },
    { id: 'slate', hex: '#334155', name: 'Stealth' },
    { id: 'white', hex: '#f8fafc', name: 'Pure White' },
    { id: 'black', hex: '#0f172a', name: 'Midnight' },
];

export const PAINT_PATTERNS = [
    { id: 'SOLID', name: 'Factory Standard' },
    { id: 'STRIPES', name: 'Racing Stripes' },
    { id: 'CAMO', name: 'Tactical Camo' },
    { id: 'HAZARD', name: 'Industrial Hazard' },
];

// Default Starter Build
export const STARTER_BUILD: MechBuild = {
  id: 'mech_starter_01',
  name: 'ROOKIE-01',
  cosmetics: {
      primary: 'zinc',
      secondary: 'cyan',
      pattern: 'SOLID'
  },
  parts: {
    [PartCategory.HEAD]: DEFAULT_PARTS.find(p => p.id === 'h_01')!,
    [PartCategory.CORE]: DEFAULT_PARTS.find(p => p.id === 'c_01')!,
    [PartCategory.ARMS]: DEFAULT_PARTS.find(p => p.id === 'a_01')!,
    [PartCategory.LEGS]: DEFAULT_PARTS.find(p => p.id === 'l_01')!,
    [PartCategory.GENERATOR]: DEFAULT_PARTS.find(p => p.id === 'g_01')!,
    [PartCategory.RADIATOR]: DEFAULT_PARTS.find(p => p.id === 'rad_01')!,
    [PartCategory.BOOSTER]: DEFAULT_PARTS.find(p => p.id === 'bst_01')!,
    [PartCategory.FCS]: DEFAULT_PARTS.find(p => p.id === 'f_01')!,
    [PartCategory.WEAPON_R]: DEFAULT_PARTS.find(p => p.id === 'w_r_01')!,
    [PartCategory.WEAPON_L]: DEFAULT_PARTS.find(p => p.id === 'w_l_01')!,
    [PartCategory.BACK_L]: DEFAULT_PARTS.find(p => p.id === 'w_b_l_01')!,
    [PartCategory.BACK_R]: DEFAULT_PARTS.find(p => p.id === 'w_b_r_01')!,
  },
  aiConfig: {
    mode: 'SLIDERS',
    sliders: {
      aggression: 50,
      caution: 50,
      mobility: 50,
      focus: 50,
      energySave: 50
    },
    treeNodes: [
      { id: 'root', type: 'ROOT', label: 'Main Logic', x: 250, y: 50, children: ['sel1'] },
      { id: 'sel1', type: 'SELECTOR', label: 'Combat Priority', x: 250, y: 150, children: ['seq1', 'seq2'] },
      { id: 'seq1', type: 'SEQUENCE', label: 'Melee Attack', x: 100, y: 300, children: ['cond1', 'act1'] },
      { id: 'cond1', type: 'CONDITION', label: 'Range < 50m', x: 50, y: 450, children: [], config: { condition: 'range_less', param: '50' } },
      { id: 'act1', type: 'ACTION', label: 'Use Blade', x: 150, y: 450, children: [], config: { action: 'attack_left' } },
      { id: 'seq2', type: 'SEQUENCE', label: 'Ranged Attack', x: 400, y: 300, children: ['act2'] },
      { id: 'act2', type: 'ACTION', label: 'Fire Rifle', x: 400, y: 450, children: [], config: { action: 'attack_right' } },
    ]
  },
  stats: BASE_STATS
};
STARTER_BUILD.stats = calculateStats(STARTER_BUILD.parts, STARTER_BUILD.aiConfig);

// Helper to ensure stats are valid for enemies
const createEnemy = (profile: EnemyProfile): EnemyProfile => {
    profile.build.stats = calculateStats(profile.build.parts, profile.build.aiConfig);
    // Ensure cosmetics exist for legacy reasons or just safety
    if (!profile.build.cosmetics) {
        profile.build.cosmetics = { primary: 'red', secondary: 'black', pattern: 'SOLID' };
    }
    return profile;
};

// Mock Enemies
export const ENEMIES: EnemyProfile[] = [
  createEnemy({
    id: 'enemy_01',
    name: 'TARGET-DUMMY',
    description: 'A basic training drone.',
    difficulty: 'EASY',
    reward: 5000,
    rating: 1200,
    rd: 350,
    build: {
      ...STARTER_BUILD,
      id: 'enemy_build_01',
      name: 'DRONE-X',
      cosmetics: { primary: 'zinc', secondary: 'orange', pattern: 'HAZARD' },
      aiConfig: {
        mode: 'SLIDERS',
        sliders: { aggression: 20, caution: 20, mobility: 10, focus: 10, energySave: 80 },
        treeNodes: []
      },
      stats: BASE_STATS
    }
  }),
  createEnemy({
    id: 'enemy_02',
    name: 'CRIMSON FANG',
    description: 'A high-mobility close quarters AC.',
    difficulty: 'MEDIUM',
    reward: 12000,
    rating: 1500,
    rd: 150,
    build: {
      ...STARTER_BUILD,
      id: 'enemy_build_02',
      name: 'CRIMSON FANG',
      cosmetics: { primary: 'red', secondary: 'black', pattern: 'STRIPES' },
      parts: {
          ...STARTER_BUILD.parts,
          [PartCategory.LEGS]: DEFAULT_PARTS.find(p => p.id === 'l_02')!, // Rev Joint
          [PartCategory.WEAPON_R]: DEFAULT_PARTS.find(p => p.id === 'w_r_02')!, // MG
          [PartCategory.BOOSTER]: DEFAULT_PARTS.find(p => p.id === 'bst_02')! // Fast Booster
      },
      aiConfig: {
        mode: 'SLIDERS',
        sliders: { aggression: 90, caution: 20, mobility: 90, focus: 80, energySave: 20 },
        treeNodes: []
      },
      stats: BASE_STATS
    }
  }),
  createEnemy({
    id: 'enemy_03',
    name: 'STEEL WALL',
    description: 'Heavy tank AC.',
    difficulty: 'HARD',
    reward: 25000,
    rating: 1800,
    rd: 100,
    build: {
      ...STARTER_BUILD,
      id: 'enemy_build_03',
      name: 'STEEL WALL',
      cosmetics: { primary: 'slate', secondary: 'green', pattern: 'CAMO' },
      parts: {
          ...STARTER_BUILD.parts,
          [PartCategory.CORE]: DEFAULT_PARTS.find(p => p.id === 'c_03')!, // Heavy Core
          [PartCategory.LEGS]: DEFAULT_PARTS.find(p => p.id === 'l_03')!, // Tank
          [PartCategory.WEAPON_R]: DEFAULT_PARTS.find(p => p.id === 'w_r_03')!, // Bazooka
          [PartCategory.BACK_L]: DEFAULT_PARTS.find(p => p.id === 'w_b_l_02')! // Cannon
      },
      aiConfig: {
        mode: 'CHIP',
        activeChipId: 'chip_turtle',
        sliders: { aggression: 0, caution: 0, mobility: 0, focus: 0, energySave: 0 },
        treeNodes: []
      },
      stats: BASE_STATS
    }
  }),
  createEnemy({
    id: 'enemy_04',
    name: 'NIGHT RAVEN',
    description: 'Elite sniper unit with stealth capabilities.',
    difficulty: 'BOSS',
    reward: 50000,
    rating: 2100,
    rd: 80,
    build: {
      ...STARTER_BUILD,
      id: 'enemy_build_04',
      name: 'NIGHT RAVEN',
      cosmetics: { primary: 'black', secondary: 'purple', pattern: 'SOLID' },
      parts: {
          ...STARTER_BUILD.parts,
          [PartCategory.HEAD]: DEFAULT_PARTS.find(p => p.id === 'h_02')!, // Scanner Head
          [PartCategory.ARMS]: DEFAULT_PARTS.find(p => p.id === 'a_02')!, // Fire Control Arms
          [PartCategory.LEGS]: DEFAULT_PARTS.find(p => p.id === 'l_04')!, // Quad
          [PartCategory.WEAPON_R]: DEFAULT_PARTS.find(p => p.id === 'w_r_01')!, // Rifle
          [PartCategory.WEAPON_L]: DEFAULT_PARTS.find(p => p.id === 'w_l_02')!, // Shield
          [PartCategory.BACK_R]: DEFAULT_PARTS.find(p => p.id === 'w_b_r_02')!, // Radar
          [PartCategory.BACK_L]: DEFAULT_PARTS.find(p => p.id === 'w_b_l_02')! // Cannon
      },
      aiConfig: {
        mode: 'CHIP',
        activeChipId: 'chip_sniper',
        sliders: { aggression: 0, caution: 0, mobility: 0, focus: 0, energySave: 0 },
        treeNodes: []
      },
      stats: BASE_STATS
    }
  })
];

export const TOURNAMENTS: Tournament[] = [
    { id: 't_rookie', name: 'Rookie League', description: 'Entry level competition for new Architects.', rankRequirement: 'E', prizePool: 10000, participants: 16, difficulty: 'ROOKIE' },
    { id: 't_open', name: 'Open Circuit', description: 'Standard ranked matches.', rankRequirement: 'D', prizePool: 25000, participants: 32, difficulty: 'INTERMEDIATE' },
    { id: 't_elite', name: 'Elite Championship', description: 'High stakes combat for veterans.', rankRequirement: 'C', prizePool: 100000, participants: 64, difficulty: 'ELITE' },
];
