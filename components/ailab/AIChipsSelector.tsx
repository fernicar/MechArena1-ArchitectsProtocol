
import React, { useState } from 'react';
import { AIChip, MechBuild, DebugSettings } from '../../types';
import { AI_CHIPS } from '../../constants';
import { useGameStore } from '../../store';
import ConfirmationModal from '../common/ConfirmationModal';

interface AIChipsSelectorProps {
    build: MechBuild;
    userLevel: number;
    onSelect: (chip: AIChip) => void;
    debugSettings: DebugSettings;
}

const AIChipsSelector: React.FC<AIChipsSelectorProps> = ({ build, userLevel, onSelect, debugSettings }) => {
    const { userChips, deleteUserChip } = useGameStore();
    const [tab, setTab] = useState<'PRESET' | 'USER'>('PRESET');
    const [chipToDelete, setChipToDelete] = useState<string | null>(null);

    const handleDeleteRequest = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setChipToDelete(id);
    };

    const confirmDelete = () => {
        if (chipToDelete) {
            deleteUserChip(chipToDelete);
            setChipToDelete(null);
        }
    };

    return (
      <div className="flex flex-col h-full overflow-hidden relative">
          <ConfirmationModal 
              isOpen={!!chipToDelete}
              title="DELETE MEMORY CHIP"
              message="Erase this custom AI logic chip? This action cannot be undone."
              confirmLabel="ERASE DATA"
              onConfirm={confirmDelete}
              onCancel={() => setChipToDelete(null)}
          />

          <div className="flex gap-4 mb-4 border-b border-slate-700 pb-2">
              <button 
                onClick={() => setTab('PRESET')}
                className={`text-xs font-bold uppercase tracking-wider pb-1 transition-colors ${tab === 'PRESET' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                  Factory Presets
              </button>
              <button 
                onClick={() => setTab('USER')}
                className={`text-xs font-bold uppercase tracking-wider pb-1 transition-colors ${tab === 'USER' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                  User Memory ({userChips.length})
              </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
              {tab === 'PRESET' && AI_CHIPS.map(chip => {
                  const isActive = build.aiConfig.activeChipId === chip.id && build.aiConfig.mode === 'CHIP';
                  const isLevelLocked = chip.unlockLevel > userLevel;
                  const isLocked = isLevelLocked && !(debugSettings.enabled && debugSettings.unlockAllChips);

                  return (
                      <button
                          key={chip.id}
                          onClick={() => onSelect(chip)}
                          className={`p-6 border-l-4 text-left transition-all relative overflow-hidden group
                              ${isActive 
                                  ? 'bg-yellow-900/20 border-yellow-500' 
                                  : isLocked
                                    ? 'bg-slate-950 border-slate-800 opacity-60 cursor-not-allowed'
                                    : 'bg-slate-900/50 border-slate-700 hover:bg-slate-800 hover:border-slate-500'}
                          `}
                      >
                          <div className="text-4xl mb-2">{chip.icon}</div>
                          <h3 className={`text-lg font-bold uppercase mb-2 ${isActive ? 'text-yellow-400' : isLocked ? 'text-slate-600' : 'text-white'}`}>{chip.name}</h3>
                          <p className="text-sm text-slate-400">{chip.description}</p>
                          
                          {isActive && <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_10px_#eab308]"></div>}
                          
                          {isLocked && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                   <div className="border border-red-900 text-red-500 text-xs px-2 py-1 font-bold uppercase bg-black">
                                       LOCKED (LVL {chip.unlockLevel})
                                   </div>
                              </div>
                          )}
                      </button>
                  );
              })}

              {tab === 'USER' && (
                  userChips.length === 0 ? (
                      <div className="col-span-full text-center text-slate-600 py-12 flex flex-col items-center">
                          <div className="text-4xl mb-2 opacity-50">💾</div>
                          <p className="uppercase tracking-widest text-xs">No user chips found.</p>
                          <p className="text-[10px] mt-2 max-w-xs">Create custom chips by saving your configurations in the Personality or Tree editor.</p>
                      </div>
                  ) : (
                      userChips.map(chip => {
                          const isActive = build.aiConfig.activeChipId === chip.id && build.aiConfig.mode === 'CHIP';
                          return (
                              <button
                                  key={chip.id}
                                  onClick={() => onSelect(chip)}
                                  className={`p-6 border-l-4 text-left transition-all relative overflow-hidden group
                                      ${isActive 
                                          ? 'bg-purple-900/20 border-purple-500' 
                                          : 'bg-slate-900/50 border-slate-700 hover:bg-slate-800 hover:border-slate-500'}
                                  `}
                              >
                                  <div className="flex justify-between items-start">
                                      <div className="text-4xl mb-2">💾</div>
                                      <div 
                                        onClick={(e) => handleDeleteRequest(e, chip.id)}
                                        className="text-slate-600 hover:text-red-500 p-1 cursor-pointer z-10"
                                      >
                                          ✕
                                      </div>
                                  </div>
                                  <h3 className={`text-lg font-bold uppercase mb-2 ${isActive ? 'text-purple-400' : 'text-white'}`}>{chip.name}</h3>
                                  <p className="text-sm text-slate-400">{chip.description}</p>
                                  <div className="mt-2 text-[9px] text-slate-600 font-mono">
                                      TYPE: {chip.config.mode} // COST: {chip.cost}
                                  </div>
                                  
                                  {isActive && <div className="absolute top-2 right-2 w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-[0_0_10px_#a855f7]"></div>}
                              </button>
                          );
                      })
                  )
              )}
          </div>
      </div>
    );
};

export default AIChipsSelector;
