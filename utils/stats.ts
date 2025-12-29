
import { PartCategory, MechPart, AIConfig, MechStats } from '../types';
import { AI_CHIPS } from '../data/items';

export const BASE_STATS: MechStats = {
  ap: 0, weight: 0, weightCapacity: 0, energyOutput: 0, energyCapacity: 0, energyDrain: 0, 
  cooling: 0, heatCapacity: 0, mobility: 0, firepower: 0, defense: 0, scanRange: 0, ammo: 0,
  aiCapacity: 0, aiLoad: 0, precision: 0
};

export const calculateAILoad = (aiConfig: AIConfig): number => {
    if (aiConfig.mode === 'SLIDERS') return 40; // Base cost for manual sliders
    if (aiConfig.mode === 'CHIP') {
        const chip = AI_CHIPS.find(c => c.id === aiConfig.activeChipId);
        return chip ? chip.cost : 40;
    }
    if (aiConfig.mode === 'TREE') {
        // Base overhead + cost per node
        return 20 + (aiConfig.treeNodes.length * 10);
    }
    return 0;
};

export const calculateStats = (parts: Record<PartCategory, MechPart>, aiConfig?: AIConfig): MechStats => {
  const initial: MechStats = { ...BASE_STATS };
  
  const stats = Object.values(parts).reduce((acc, part) => {
    return {
      ap: acc.ap + (part.stats.ap || 0),
      weight: acc.weight + (part.stats.weight || 0),
      weightCapacity: acc.weightCapacity + (part.stats.weightCapacity || 0),
      energyOutput: acc.energyOutput + (part.stats.energyOutput || 0),
      energyCapacity: acc.energyCapacity + (part.stats.energyCapacity || 0),
      energyDrain: acc.energyDrain + (part.stats.energyDrain || 0),
      cooling: acc.cooling + (part.stats.cooling || 0),
      heatCapacity: acc.heatCapacity + (part.stats.heatCapacity || 0),
      mobility: acc.mobility + (part.stats.mobility || 0),
      firepower: acc.firepower + (part.stats.firepower || 0),
      defense: acc.defense + (part.stats.defense || 0),
      scanRange: acc.scanRange + (part.stats.scanRange || 0),
      ammo: acc.ammo + (part.stats.ammo || 0),
      aiCapacity: acc.aiCapacity + (part.stats.aiCapacity || 0),
      precision: acc.precision + (part.stats.precision || 0),
      aiLoad: 0, // Calculated later
      lockTime: 0 // Unused for now
    };
  }, initial);

  if (aiConfig) {
      stats.aiLoad = calculateAILoad(aiConfig);
  }

  return stats;
};
