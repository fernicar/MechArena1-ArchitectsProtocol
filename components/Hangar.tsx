
import React, { useState } from 'react';
import { useGameStore } from '../store';
import { getMechValidationErrors } from '../utils/validation';
import { playSound } from '../services/audioService';
import { MechBuild } from '../types';
import MechStatusCard from './hangar/MechStatusCard';
import HangarActions from './hangar/HangarActions';
import ConfirmationModal from './common/ConfirmationModal';

interface HangarProps {
  onNavigate: (view: 'GARAGE' | 'AILAB' | 'ARENA' | 'TOURNAMENT' | 'MAIL' | 'PROFILE' | 'SETTINGS') => void;
}

const Hangar: React.FC<HangarProps> = ({ onNavigate }) => {
  const { mechs, activeMechId, setActiveMech, createNewMech, deleteMech, profile, credits, mails, systemLogs } = useGameStore();
  const unreadMail = mails.filter(m => !m.read).length;
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const mech = activeMechId && mechs[activeMechId] ? mechs[activeMechId] : null;
  const mechList = Object.values(mechs) as MechBuild[];
  const currentMechIndex = mechList.findIndex(m => m.id === activeMechId);

  const today = new Date().toISOString().split('T')[0];
  const dailyBonusActive = profile && profile.lastWinDate !== today;

  if (!mech || !profile) return null;

  const validationErrors = getMechValidationErrors(mech);
  const isMechValid = validationErrors.length === 0;

  const handleSortieAttempt = (view: 'ARENA' | 'TOURNAMENT') => {
      if (isMechValid) {
          onNavigate(view);
      } else {
          playSound('ALARM');
      }
  };

  const cycleMech = (dir: number) => {
      playSound('UI_HOVER');
      const len = mechList.length;
      if (len === 0) return;
      let nextIdx = currentMechIndex + dir;
      if (nextIdx < 0) nextIdx = len - 1;
      if (nextIdx >= len) nextIdx = 0;
      setActiveMech(mechList[nextIdx].id);
  };

  const handleCreate = () => {
      if (mechList.length < 10) {
          playSound('UI_CLICK');
          createNewMech();
          onNavigate('GARAGE');
      } else {
          playSound('ALARM');
      }
  };

  const handleDeleteRequest = () => {
      if (mechList.length > 1) {
          setShowDeleteModal(true);
          playSound('UI_CLICK');
      } else {
          playSound('ALARM');
          console.warn("[Hangar] Cannot delete last unit.");
      }
  };

  const confirmDelete = () => {
      console.log("[Hangar] Delete confirmed for:", mech.id);
      playSound('EXPLODE');
      deleteMech(mech.id);
      setShowDeleteModal(false);
  };

  // Rank Color Logic
  const getRankColor = (rank: string) => {
      switch(rank) {
          case 'S': return 'text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]';
          case 'A': return 'text-cyan-400';
          case 'B': return 'text-green-400';
          case 'C': return 'text-yellow-400';
          case 'D': return 'text-orange-400';
          default: return 'text-slate-400';
      }
  };

  return (
    <div className="h-full w-full bg-slate-950 relative overflow-hidden flex flex-col">
       <ConfirmationModal 
           isOpen={showDeleteModal}
           title="SCRAP UNIT WARNING"
           message={`Are you sure you want to dismantle "${mech.name}"? This action involves permanent data loss and cannot be undone.`}
           confirmLabel="SCRAP UNIT"
           onConfirm={confirmDelete}
           onCancel={() => setShowDeleteModal(false)}
       />

       {/* Background Elements */}
       <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_15px_#22d3ee]"></div>
       </div>

       {/* Top Bar */}
       <header className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 gap-4">
            <div>
                <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tighter" style={{ textShadow: '0 0 20px rgba(6,182,212,0.5)' }}>
                    HANGAR <span className="text-cyan-500">CONTROL</span>
                </h1>
                <p className="text-slate-400 uppercase tracking-[0.5em] text-xs mt-1">System Online // Unit Ready</p>
            </div>
            
            <div className="flex gap-4 self-end sm:self-auto items-center">
                {dailyBonusActive && (
                    <div className="animate-pulse bg-yellow-500/20 border border-yellow-500 text-yellow-500 text-xs px-3 py-1 font-bold uppercase tracking-wider rounded">
                        Daily Bonus Active (+200 XP)
                    </div>
                )}

                <div 
                    onClick={() => onNavigate('PROFILE')}
                    className="flex flex-col items-end cursor-pointer group hover:bg-slate-900/50 p-2 rounded transition-colors"
                >
                    <div className="text-xs text-slate-400 uppercase group-hover:text-white">Pilot Rank</div>
                    <div className={`text-xl font-bold ${getRankColor(profile.rank)}`}>
                        RANK {profile.rank} <span className="text-xs text-slate-500 font-mono ml-2">R:{profile.rating}</span>
                    </div>
                </div>
                
                <div className="flex flex-col items-end border-l border-slate-700 pl-4 h-full justify-center">
                    <div className="text-xs text-slate-400 uppercase">Credits</div>
                    <div className="text-xl font-mono text-yellow-400 font-bold">{credits.toLocaleString()} C</div>
                </div>

                <div className="flex gap-2 ml-4">
                    <button 
                        onClick={() => onNavigate('MAIL')}
                        className={`flex items-center justify-center w-12 h-12 border rounded relative transition-all
                            ${unreadMail > 0 
                                ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400 animate-pulse' 
                                : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        title="Messages"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        {unreadMail > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-black text-[9px] font-bold flex items-center justify-center rounded-full">
                                {unreadMail}
                            </div>
                        )}
                    </button>
                    
                    <button 
                        onClick={() => onNavigate('SETTINGS')}
                        className="flex items-center justify-center w-12 h-12 border border-slate-700 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                        title="Settings"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                </div>
            </div>
       </header>

       {/* Main Content Area */}
       <div className="relative z-10 flex-1 flex flex-col lg:flex-row p-6 gap-8 overflow-y-auto">
            {/* Left: Mech Status & Roster */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
                
                {/* Roster Controls */}
                <div className="flex justify-between items-center bg-slate-900 border border-slate-700 p-2">
                    <button onClick={() => cycleMech(-1)} className="p-2 hover:text-cyan-500 transition-colors">◀</button>
                    <div className="text-center">
                        <span className="text-xs text-slate-500 uppercase tracking-widest block">Unit Select</span>
                        <span className="font-mono text-white font-bold">{currentMechIndex + 1} / {mechList.length}</span>
                    </div>
                    <button onClick={() => cycleMech(1)} className="p-2 hover:text-cyan-500 transition-colors">▶</button>
                </div>

                <MechStatusCard 
                    mech={mech} 
                    isMechValid={isMechValid} 
                    validationErrors={validationErrors} 
                    onNavigateGarage={() => onNavigate('GARAGE')}
                />

                <div className="flex gap-2">
                     <button 
                         onClick={handleCreate} 
                         disabled={mechList.length >= 10}
                         className={`flex-1 py-2 text-xs font-bold uppercase border border-slate-700 hover:border-cyan-500 hover:text-cyan-500 hover:bg-slate-900 ${mechList.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''}`}
                     >
                         New Frame
                     </button>
                     <button 
                         onClick={handleDeleteRequest}
                         disabled={mechList.length <= 1}
                         className={`flex-1 py-2 text-xs font-bold uppercase border border-slate-700 hover:border-red-500 hover:text-red-500 hover:bg-slate-900 ${mechList.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                     >
                         Scrap Unit
                     </button>
                </div>

                <div className="min-h-[120px] bg-slate-900/80 border-t-2 border-purple-500 p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-slate-400 text-sm uppercase tracking-widest mb-1">AI Logic</h3>
                        <div className="text-xl font-bold text-white">
                            {mech.aiConfig.mode === 'TREE' ? 'CUSTOM TREE' : 
                             mech.aiConfig.mode === 'CHIP' ? 'PRESET CHIP' : 'PERSONALITY SLIDERS'}
                        </div>
                    </div>
                    <button 
                        onClick={() => onNavigate('AILAB')}
                        className="w-full py-2 border border-purple-500/50 text-purple-400 hover:bg-purple-500 hover:text-white font-bold uppercase tracking-widest text-sm transition-all"
                    >
                        Configure Logic
                    </button>
                </div>
            </div>

            {/* Center/Right: Action & Info */}
            <div className="flex-1 flex flex-col gap-4">
                <HangarActions isMechValid={isMechValid} onSortie={handleSortieAttempt} />

                {/* Bottom Panels */}
                <div className="flex flex-col md:flex-row gap-4">
                     <div className="w-full md:w-1/2 bg-slate-900/80 p-6 border border-slate-800 relative flex flex-col">
                        <h3 className="text-slate-500 text-xs uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 flex justify-between">
                            <span>Live Feed</span>
                            <span className="text-[9px] text-cyan-500 animate-pulse">● LIVE</span>
                        </h3>
                        <div className="flex-1 overflow-hidden relative min-h-[100px]">
                            <div className="absolute inset-x-0 bottom-0 space-y-1">
                                {systemLogs.slice(0, 6).reverse().map((log, i) => (
                                    <div key={i} className={`text-sm font-mono border-l-2 pl-2 animate-fade-in
                                        ${log.includes('VICTORY') ? 'text-green-400 border-green-500' : 
                                          log.includes('DEFEAT') ? 'text-red-400 border-red-500' :
                                          log.includes('Purchased') ? 'text-yellow-400 border-yellow-500' :
                                          log.includes('Message') ? 'text-cyan-400 border-cyan-500' :
                                          'text-slate-400 border-slate-700'
                                        }
                                    `}>
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="absolute bottom-2 right-2 text-[10px] text-slate-600">SYS_V1.0.4</div>
                     </div>
                     <div 
                        onClick={() => onNavigate('PROFILE')}
                        className="w-full md:w-1/2 bg-slate-900/80 p-6 border border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800 group"
                     >
                         <div>
                             <div className="text-xs text-slate-500 uppercase">Career Level</div>
                             <div className="text-3xl font-bold text-white group-hover:text-cyan-400 transition-colors">{profile.level}</div>
                         </div>
                         <div className="text-right">
                             <div className="text-xs text-slate-500 uppercase">Win Ratio</div>
                             <div className="text-3xl font-bold text-white">
                                {profile.wins + profile.losses > 0 ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100) : 0}%
                             </div>
                         </div>
                     </div>
                </div>
            </div>
       </div>
    </div>
  );
};

export default Hangar;
