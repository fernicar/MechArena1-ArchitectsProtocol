
export interface DebugSettings {
  enabled: boolean;
  unlockAllParts: boolean;
  unlockAllChips: boolean;
  unlockTree: boolean;
  instantLevelUp: boolean;
}

export enum PartCategory {
  HEAD = 'HEAD',
  CORE = 'CORE',
  ARMS = 'ARMS',
  LEGS = 'LEGS',
  GENERATOR = 'GENERATOR',
  RADIATOR = 'RADIATOR',
  BOOSTER = 'BOOSTER',
  FCS = 'FCS',
  WEAPON_R = 'WEAPON_R',
  WEAPON_L = 'WEAPON_L',
  BACK_L = 'BACK_L',
  BACK_R = 'BACK_R',
}

export interface MechStats {
  ap: number;
  weight: number;
  weightCapacity: number;
  energyOutput: number;
  energyCapacity: number;
  energyDrain: number;
  cooling: number;
  heatCapacity: number;
  mobility: number;
  firepower: number;
  defense: number;
  scanRange: number;
  ammo: number;
  aiCapacity: number;
  aiLoad: number;
  precision: number;
  lockTime?: number;
}

export interface MechPart {
  id: string;
  name: string;
  description: string;
  category: PartCategory;
  cost: number;
  unlockLevel: number;
  stats: Partial<MechStats>;
  spec?: {
    legType?: 'BIPED' | 'REVERSE_JOINT' | 'TANK' | 'QUAD' | 'HOVER';
    weaponType?: 'RIFLE' | 'MACHINE_GUN' | 'BAZOOKA' | 'CANNON' | 'MISSILE' | 'BLADE' | 'SHIELD' | 'RADAR';
    range?: 'SHORT' | 'MEDIUM' | 'LONG';
  };
}

export interface AISliders {
  aggression: number;
  caution: number;
  mobility: number;
  focus: number;
  energySave: number;
}

export type BehaviorNodeType = 'ROOT' | 'SELECTOR' | 'SEQUENCE' | 'CONDITION' | 'ACTION';

export interface BehaviorNode {
  id: string;
  type: BehaviorNodeType;
  label: string;
  x: number;
  y: number;
  children: string[];
  config?: {
    condition?: string;
    param?: string;
    action?: string;
  };
}

export interface AIConfig {
  mode: 'SLIDERS' | 'TREE' | 'CHIP';
  sliders: AISliders;
  treeNodes: BehaviorNode[];
  activeChipId?: string;
}

export type PaintPattern = 'SOLID' | 'CAMO' | 'STRIPES' | 'HAZARD';

export interface MechCosmetics {
    primary: string; // color ID
    secondary: string; // color ID
    pattern: PaintPattern;
}

export interface MechBuild {
  id: string;
  name: string;
  // Legacy color support handled via migration or accessor
  color?: string; 
  cosmetics: MechCosmetics;
  parts: Record<PartCategory, MechPart>;
  aiConfig: AIConfig;
  stats: MechStats;
  imageUrl?: string;
}

export interface EnemyProfile {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  reward: number;
  rating: number;
  rd: number;
  build: MechBuild;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  rankRequirement: string;
  prizePool: number;
  participants: number;
  difficulty: string;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'PILLAR' | 'WALL' | 'DEBRIS';
}

export interface Projectile {
    id: string;
    ownerId: string;
    position: Vector2;
    velocity: Vector2;
    damage: number;
    impact?: number;
    color: string;
    type: 'RIFLE' | 'MACHINE_GUN' | 'BAZOOKA' | 'CANNON' | 'MISSILE';
    guidance?: number;
    targetId?: string;
}

export interface BattleEvent {
    type: 'FIRE' | 'HIT' | 'MELEE_HIT' | 'SHIELD_BLOCK' | 'WALL_COLLISION' | 'DESTROYED' | 'STAGGER_BREAK' | 'AI_DECISION';
    sourceId?: string;
    targetId?: string;
    damage?: number;
    location?: Vector2;
    message?: string;
}

export interface MechBattleState {
    id: string;
    position: Vector2;
    rotation: number;
    velocity: Vector2;
    targetRotation: number;
    hp: number;
    maxHp: number;
    energy: number;
    maxEnergy: number;
    heat: number;
    maxHeat: number;
    stability: number;
    maxStability: number;
    isStaggered: boolean;
    staggerTimer: number;

    weaponRAmmo: number;
    maxWeaponRAmmo: number;
    weaponLAmmo: number;
    maxWeaponLAmmo: number;
    backLAmmo: number;
    maxBackLAmmo: number;
    backRAmmo: number;
    maxBackRAmmo: number;

    weaponRCooldown: number;
    weaponLCooldown: number;
    backLCooldown: number;
    backRCooldown: number;
    
    isBoosting: boolean;
    isFiringR: boolean;
    isFiringL: boolean;
    isFiringBackL: boolean;
    isFiringBackR: boolean;
    isOverheated: boolean;
    isShielded: boolean;
    shieldTime: number;

    visualConfig?: {
        legType: string;
        baseColor: string; // hex
        secondaryColor: string; // hex
        pattern: PaintPattern;
        weaponR: string;
        weaponL: string;
        backL: string;
        backR: string;
    };
}

export interface BattleFrame {
    tick: number;
    player: MechBattleState;
    enemy: MechBattleState;
    projectiles: Projectile[];
    events: BattleEvent[];
}

export interface BattleResult {
    winner: 'PLAYER' | 'ENEMY';
    frames: BattleFrame[];
    duration: number;
    log: string[];
    obstacles: Obstacle[];
    arenaType: string;
    enemyName?: string;
    reward?: number;
    date?: string;
    ratingChange?: number;
    tournamentId?: string;
}

export interface PlayerProfile {
  name: string;
  rank: string;
  rating: number;
  rd: number;
  vol: number;
  level: number;
  exp: number;
  wins: number;
  losses: number;
  nextLevelExp: number;
  lastWinDate: string;
}

export interface Mail {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: 'SYSTEM' | 'BATTLE' | 'TOURNAMENT';
  battleResult?: BattleResult;
}

export interface AIChip {
    id: string;
    name: string;
    description: string;
    icon: string;
    cost: number;
    unlockLevel: number;
    isCustom?: boolean;
    config: AIConfig;
}

export interface Rival {
    id: string;
    name: string;
    mechName: string;
    rating: number;
    trend: 'UP' | 'DOWN' | 'SAME';
}
