
import React, { useMemo } from 'react';
import { useGameStore } from '../store';
import { getRankFromRating } from '../utils/glicko';

interface ProfileViewProps {
  onExit: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ onExit }) => {
  const { profile, mails } = useGameStore();

  const battles = useMemo(() => 
    mails
      .filter(m => m.type === 'BATTLE' || m.type === 'TOURNAMENT')
      .slice(0, 10), 
  [mails]);

  if (!profile) return null;

  const winRate = profile.wins + profile.losses > 0 
    ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100) 
    : 0;

  const progressPercent = Math.min(100, Math.round((profile.exp / profile.nextLevelExp) * 100));

  // Unlock mapping based on spec
  const unlocks = [
    { level: 1, text: 'Base Parts & Chips', unlocked: true },
    { level: 5, text: 'Intermediate Parts & Tree Editor', unlocked: profile.level >= 5 },
    { level: 10, text: 'Advanced Parts & Chips', unlocked: profile.level >= 10 },
    { level: 15, text: 'Expert Parts', unlocked: profile.level >= 15 },
    { level: 20, text: 'Elite Parts & Chips', unlocked: profile.level >= 20 },
    { level: 25, text: 'Legendary Parts', unlocked: profile.level >= 25 },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1614726365723-49cfae968da5?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10 grayscale"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-900/90 z-0"></div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
           <h1 className="text-4xl font-bold text-white uppercase tracking-widest glow-text">Pilot Profile</h1>
           <p className="text-xs text-slate-500 uppercase tracking-[0.3em] mt-1">Personnel Record // {profile.name}</p>
        </div>
        <button 
           onClick={onExit}
           className="px-6 py-2 border border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-white uppercase text-sm tracking-wider transition-all"
        >
           Return to Hangar
        </button>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
        
        {/* Left Column: Stats Card */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
           {/* Pilot Card */}
           <div className="bg-slate-900/80 border border-slate-700 p-6 flex flex-col items-center text-center relative overflow-hidden group">
               <div className="w-32 h-32 bg-slate-800 rounded-full border-4 border-slate-700 mb-4 flex items-center justify-center overflow-hidden relative">
                   <svg className="w-20 h-20 text-slate-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                   <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay"></div>
               </div>
               <h2 className="text-2xl font-bold text-white mb-1">{profile.name}</h2>
               <div className="text-cyan-500 font-mono text-sm mb-4">LICENSED ARCHITECT</div>
               
               <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                   <div>
                       <div className="text-xs text-slate-500 uppercase">Rank</div>
                       <div className="text-3xl font-bold text-yellow-500">{profile.rank}</div>
                   </div>
                   <div>
                       <div className="text-xs text-slate-500 uppercase">Rating</div>
                       <div className="text-3xl font-bold text-white font-mono">{profile.rating}</div>
                   </div>
               </div>
           </div>

           {/* Performance Stats */}
           <div className="bg-slate-900/80 border border-slate-700 p-6">
               <h3 className="text-slate-400 text-xs uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Combat Performance</h3>
               <div className="space-y-4">
                   <div className="flex justify-between items-center">
                       <span className="text-sm text-slate-300">Win Rate</span>
                       <span className={`font-mono font-bold ${winRate > 50 ? 'text-green-400' : 'text-slate-400'}`}>{winRate}%</span>
                   </div>
                   <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-green-500" style={{ width: `${winRate}%` }}></div>
                   </div>
                   
                   <div className="grid grid-cols-3 gap-2 text-center pt-2">
                       <div className="bg-slate-950 p-2 rounded">
                           <div className="text-xs text-slate-500">Wins</div>
                           <div className="text-lg font-bold text-green-400">{profile.wins}</div>
                       </div>
                       <div className="bg-slate-950 p-2 rounded">
                           <div className="text-xs text-slate-500">Losses</div>
                           <div className="text-lg font-bold text-red-400">{profile.losses}</div>
                       </div>
                       <div className="bg-slate-950 p-2 rounded">
                           <div className="text-xs text-slate-500">Matches</div>
                           <div className="text-lg font-bold text-white">{profile.wins + profile.losses}</div>
                       </div>
                   </div>
               </div>
           </div>
        </div>

        {/* Right Column: Progression & History */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            {/* Level Progress */}
            <div className="bg-slate-900/80 border border-slate-700 p-6">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <h3 className="text-white font-bold text-lg">LEVEL {profile.level}</h3>
                        <span className="text-xs text-slate-500 uppercase">Access Clearance</span>
                    </div>
                    <div className="font-mono text-cyan-500 text-sm">
                        {Math.floor(profile.exp)} / {Math.floor(profile.nextLevelExp)} XP
                    </div>
                </div>
                <div className="w-full h-4 bg-slate-800 border border-slate-600 p-0.5 mb-6">
                    <div className="h-full bg-cyan-500 relative overflow-hidden" style={{ width: `${progressPercent}%` }}>
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:10px_10px]"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {unlocks.map((u, i) => (
                        <div key={i} className={`p-2 border text-xs flex items-center gap-2 ${u.unlocked ? 'border-cyan-900 bg-cyan-900/20 text-cyan-300' : 'border-slate-800 bg-slate-950 text-slate-600'}`}>
                            {u.unlocked ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            )}
                            <span className="font-mono">LVL {u.level}: {u.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Match History */}
            <div className="flex-1 bg-slate-900/80 border border-slate-700 p-6 overflow-hidden flex flex-col">
                <h3 className="text-slate-400 text-xs uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Recent Combat Logs</h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                    {battles.length === 0 ? (
                        <div className="text-center text-slate-600 py-8 italic">No combat data recorded.</div>
                    ) : (
                        battles.map(battle => {
                            // Check battleResult for definitive winner, fallback to string check if legacy data
                            const isVictory = battle.battleResult 
                                ? battle.battleResult.winner === 'PLAYER'
                                : battle.subject.includes('VICTORY');
                                
                            const enemyName = battle.battleResult?.enemyName || 'Unknown';
                            const ratingChange = battle.battleResult?.ratingChange;
                            
                            return (
                                <div key={battle.id} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800 hover:border-slate-600 transition-colors">
                                    <div>
                                        <div className={`text-sm font-bold ${isVictory ? 'text-green-400' : 'text-red-400'}`}>
                                            {isVictory ? 'VICTORY' : 'DEFEAT'} <span className="text-slate-500 text-xs font-normal">vs {enemyName}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono">{battle.timestamp}</div>
                                    </div>
                                    <div className="text-right">
                                        {ratingChange !== undefined && (
                                            <div className={`font-mono font-bold ${ratingChange >= 0 ? 'text-cyan-400' : 'text-red-500'}`}>
                                                {ratingChange >= 0 ? '+' : ''}{ratingChange}
                                            </div>
                                        )}
                                        <div className="text-[10px] text-slate-600 uppercase">Rating</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
