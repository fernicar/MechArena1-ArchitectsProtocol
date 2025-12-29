
import React, { useState } from 'react';
import { useGameStore } from '../store';
import { AISliders, AIChip, BehaviorNode } from '../types';
import { calculateAILoad } from '../utils/stats';
import { playSound } from '../services/audioService';
import AISlidersEditor from './ailab/AISlidersEditor';
import AIChipsSelector from './ailab/AIChipsSelector';
import AITreeEditor from './ailab/AITreeEditor';

interface AILabProps {
  onExit: () => void;
}

const AILab: React.FC<AILabProps> = ({ onExit }) => {
  const { mechs, activeMechId, profile, updateMech: onUpdateBuild, saveUserChip, debugSettings } = useGameStore();
  
  const build = activeMechId && mechs[activeMechId] ? mechs[activeMechId] : null;

  // Guard clause in case build isn't loaded yet
  if (!build || !profile) return null;
  const userLevel = profile.level;
  
  const treeUnlocked = userLevel >= 5 || (debugSettings.enabled && debugSettings.unlockTree);
  const saveUnlocked = userLevel >= 15 || (debugSettings.enabled && debugSettings.unlockAllChips); // Assuming Save unlock is part of chip unlock debug

  const [activeTab, setActiveTab] = useState<'SLIDERS' | 'TREE' | 'CHIP'>(build.aiConfig.mode);
  
  const handleSliderChange = (key: keyof AISliders, value: number) => {
    onUpdateBuild({
      ...build,
      aiConfig: {
        ...build.aiConfig,
        sliders: {
          ...build.aiConfig.sliders,
          [key]: value
        }
      }
    });
  };

  const handleModeChange = (mode: 'SLIDERS' | 'TREE' | 'CHIP') => {
    // Logic gate lock at level 5
    if (mode === 'TREE' && !treeUnlocked) return;

    setActiveTab(mode);
    onUpdateBuild({
        ...build,
        aiConfig: {
            ...build.aiConfig,
            mode: mode
        }
    });
  };

  const handleSelectChip = (chip: AIChip) => {
      const isLocked = chip.unlockLevel > userLevel && !chip.isCustom && !(debugSettings.enabled && debugSettings.unlockAllChips);
      if (isLocked) return;

      onUpdateBuild({
          ...build,
          aiConfig: {
              ...build.aiConfig,
              mode: 'CHIP',
              activeChipId: chip.id
          }
      });
  };

  const handleUpdateTree = (nodes: BehaviorNode[]) => {
      onUpdateBuild({ ...build, aiConfig: { ...build.aiConfig, treeNodes: nodes } });
  };

  const handleSaveChip = () => {
      if (!saveUnlocked) {
          playSound('ALARM');
          alert("Chip burning requires Level 15 clearance.");
          return;
      }

      if (activeTab === 'CHIP') return; // Can't save a chip as a chip (redundant)

      const name = prompt("Enter name for new Memory Chip:");
      if (!name) return;

      const currentLoad = calculateAILoad(build.aiConfig);
      
      const newChip: AIChip = {
          id: `chip_user_${Date.now()}`,
          name: name.toUpperCase(),
          description: `Custom ${activeTab} configuration.`,
          icon: '💾',
          cost: currentLoad,
          unlockLevel: 0,
          isCustom: true,
          config: {
              mode: activeTab as 'SLIDERS' | 'TREE',
              sliders: activeTab === 'SLIDERS' ? { ...build.aiConfig.sliders } : undefined,
              treeNodes: activeTab === 'TREE' ? [...build.aiConfig.treeNodes] : undefined
          }
      };

      saveUserChip(newChip);
      playSound('UI_CLICK');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-4 lg:p-6 overflow-hidden">
        <header className="flex flex-col lg:flex-row justify-between items-center mb-6 border-b border-slate-800 pb-4 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-cyan-500 uppercase tracking-widest glow-text">AI LABORATORY // LOGIC TUNING</h1>
            
            <div className="flex flex-wrap items-center justify-center gap-4 w-full lg:w-auto">
                 {/* Unified Toolbar */}
                 <div className="flex bg-slate-900 rounded border border-slate-800 p-1 items-center">
                     {/* Save Button (Left of Tabs) */}
                     {activeTab !== 'CHIP' && (
                         <button 
                            onClick={handleSaveChip}
                            disabled={!saveUnlocked}
                            className={`mr-2 border-r border-slate-700 pr-2 text-slate-400 px-3 py-1 text-xs uppercase hover:text-white transition-colors flex items-center gap-2 ${!saveUnlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={saveUnlocked ? "Save current config to Memory Chip" : "Unlock at Level 15"}
                         >
                             <span>💾</span>
                             <span className="hidden sm:inline">{saveUnlocked ? 'Save Chip' : 'Lvl 15'}</span>
                         </button>
                     )}

                     {/* Tabs */}
                     <button 
                        onClick={() => handleModeChange('SLIDERS')}
                        className={`px-4 py-1 text-xs font-bold uppercase transition-all rounded ${activeTab === 'SLIDERS' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                        Personality
                     </button>
                     <div className="relative group">
                        <button 
                            onClick={() => handleModeChange('TREE')}
                            disabled={!treeUnlocked}
                            className={`px-4 py-1 text-xs font-bold uppercase transition-all rounded
                                ${activeTab === 'TREE' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300'}
                                ${!treeUnlocked ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            Tree {!treeUnlocked && '🔒'}
                        </button>
                     </div>
                     <button 
                        onClick={() => handleModeChange('CHIP')}
                        className={`px-4 py-1 text-xs font-bold uppercase transition-all rounded ${activeTab === 'CHIP' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                        Chips
                     </button>
                 </div>

                 <button onClick={onExit} className="border border-red-500 text-red-500 px-4 py-2 hover:bg-red-500/10 uppercase text-sm tracking-wider">
                    Exit
                 </button>
            </div>
        </header>

        {activeTab === 'SLIDERS' && <AISlidersEditor build={build} onChange={handleSliderChange} />}
        {activeTab === 'TREE' && <AITreeEditor build={build} onUpdate={handleUpdateTree} />}
        {activeTab === 'CHIP' && <AIChipsSelector build={build} userLevel={userLevel} onSelect={handleSelectChip} debugSettings={debugSettings} />}
    </div>
  );
};

export default AILab;
