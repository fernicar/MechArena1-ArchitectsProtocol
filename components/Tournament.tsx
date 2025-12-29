
import React, { useState } from 'react';
import { useGameStore } from '../store';
import { TOURNAMENTS } from '../constants';
import { Tournament } from '../types';
import Leaderboard from './tournament/Leaderboard';
import { getRankValue } from '../utils/glicko';

interface TournamentProps {
  onRegister: (tournament: Tournament) => Promise<void>;
  onExit: () => void;
}

const TournamentView: React.FC<TournamentProps> = ({ onRegister, onExit }) => {
  const { profile } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'EVENTS' | 'RANKINGS'>('EVENTS');

  if (!profile) return null;

  const selectedTournament = TOURNAMENTS.find(t => t.id === selectedId);
  const isSelectedLocked = selectedTournament ? getRankValue(selectedTournament.rankRequirement) > getRankValue(profile.rank) : false;

  const handleEnter = () => {
    if (!selectedTournament || isSelectedLocked) return;
    setRegistering(true);
    setStatusMessage("CONNECTING TO LEAGUE SERVER...");
    
    // Simulate API delay sequence
    setTimeout(() => {
        setStatusMessage("VALIDATING MECH CONFIGURATION...");
        setTimeout(() => {
            setStatusMessage("REGISTRATION CONFIRMED. MATCHMAKING IN PROGRESS...");
            setTimeout(async () => {
                try {
                    await onRegister(selectedTournament);
                } catch (error) {
                    console.error("Registration failed", error);
                } finally {
                    setRegistering(false);
                    setStatusMessage(null);
                }
            }, 1500);
        }, 1500);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 overflow-hidden relative">
        {/* Background Art */}
        <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1516110833967-0b5716ca1387?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10 grayscale"></div>
        <div className="absolute inset-0 z-0 bg-slate-950/80"></div>

        <header className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-slate-800 pb-4 relative z-10 gap-4">
            <div>
                <h1 className="text-4xl font-bold text-yellow-500 uppercase tracking-widest glow-text">Tournament Network</h1>
                <p className="text-xs text-slate-400 uppercase tracking-[0.3em] mt-1">Global Ranked System // Season 01</p>
            </div>
            
            <div className="flex bg-slate-900 rounded p-1 border border-slate-800">
                 <button 
                    onClick={() => setActiveTab('EVENTS')}
                    className={`px-6 py-2 text-xs font-bold uppercase transition-all ${activeTab === 'EVENTS' ? 'bg-yellow-600 text-black' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                    Events
                 </button>
                 <button 
                    onClick={() => setActiveTab('RANKINGS')}
                    className={`px-6 py-2 text-xs font-bold uppercase transition-all ${activeTab === 'RANKINGS' ? 'bg-yellow-600 text-black' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                    Rankings
                 </button>
            </div>

            <div className="flex gap-4 items-center">
                <div className="text-right">
                     <div className="text-xs text-slate-500 uppercase">Current Rank</div>
                     <div className="text-xl font-bold text-white">{profile.rank}</div>
                </div>
                <button onClick={onExit} className="border border-slate-600 text-slate-400 px-4 py-2 hover:bg-slate-800 uppercase text-sm tracking-wider">
                    Exit Network
                </button>
            </div>
        </header>

        <div className="flex flex-1 gap-8 relative z-10 overflow-hidden">
            {activeTab === 'RANKINGS' ? (
                <div className="w-full h-full">
                    <Leaderboard />
                </div>
            ) : (
                <>
                    {/* List */}
                    <div className="w-1/3 space-y-4 overflow-y-auto pr-2">
                        {TOURNAMENTS.map(t => {
                            // Fixed check for rank requirement
                            const isLocked = getRankValue(t.rankRequirement) > getRankValue(profile.rank);
                            const isSelected = selectedId === t.id;
                            return (
                                <div 
                                    key={t.id}
                                    onClick={() => setSelectedId(t.id)}
                                    className={`p-6 border-l-4 cursor-pointer transition-all relative group overflow-hidden
                                        ${isSelected 
                                            ? 'border-yellow-500 bg-yellow-900/20' 
                                            : isLocked
                                                ? 'border-slate-800 bg-slate-900/50 opacity-60'
                                                : 'border-slate-700 bg-slate-900/50 hover:bg-slate-800'}
                                    `}
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-bold text-xl uppercase ${isSelected ? 'text-white' : isLocked ? 'text-slate-600' : 'text-slate-300'}`}>{t.name}</h3>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 font-mono">RANK {t.rankRequirement}</span>
                                            {isLocked && <span className="text-[10px] text-red-500 font-bold">LOCKED</span>}
                                        </div>
                                    </div>
                                    <p className="text-slate-500 text-sm mt-2">{t.description}</p>
                                    <div className="mt-4 flex justify-between text-xs font-mono text-slate-400">
                                        <span>PRIZE: {t.prizePool.toLocaleString()} C</span>
                                        <span>{t.participants} ENTRANTS</span>
                                    </div>
                                    {isSelected && <div className="absolute inset-0 border-2 border-yellow-500/20 pointer-events-none"></div>}
                                </div>
                            );
                        })}
                    </div>

                    {/* Detail */}
                    <div className="flex-1 bg-slate-900/80 border border-slate-700 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                        {selectedTournament ? (
                            registering ? (
                                <div className="text-center">
                                     <div className="inline-block w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-8"></div>
                                     <div className="text-yellow-500 font-mono text-lg animate-pulse">{statusMessage}</div>
                                </div>
                            ) : (
                                <div className="w-full max-w-2xl text-center">
                                    <div className="text-6xl font-bold text-slate-800 uppercase absolute top-4 left-4 select-none pointer-events-none">{selectedTournament.difficulty}</div>
                                    
                                    <h2 className="text-4xl font-bold text-white mb-4 uppercase">{selectedTournament.name}</h2>
                                    <div className="h-1 w-24 bg-yellow-500 mx-auto mb-8"></div>
                                    
                                    <p className="text-slate-300 text-lg mb-8 leading-relaxed">{selectedTournament.description}</p>
                                    
                                    <div className="grid grid-cols-3 gap-4 mb-12">
                                        <div className="bg-slate-800 p-4 border border-slate-700">
                                            <div className="text-xs text-slate-500 uppercase">Prize Pool</div>
                                            <div className="text-xl font-mono text-yellow-400">{selectedTournament.prizePool.toLocaleString()} C</div>
                                        </div>
                                        <div className="bg-slate-800 p-4 border border-slate-700">
                                            <div className="text-xs text-slate-500 uppercase">Participants</div>
                                            <div className="text-xl font-mono text-white">{selectedTournament.participants}</div>
                                        </div>
                                        <div className="bg-slate-800 p-4 border border-slate-700">
                                            <div className="text-xs text-slate-500 uppercase">Format</div>
                                            <div className="text-xl font-mono text-white">ELIMINATION</div>
                                        </div>
                                    </div>

                                    {isSelectedLocked ? (
                                        <div className="p-4 border border-red-900 bg-red-900/20 text-red-500 font-bold uppercase tracking-widest">
                                            ACCESS DENIED - RANK {selectedTournament.rankRequirement} REQUIRED
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={handleEnter}
                                            className="px-12 py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-xl uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-transform hover:scale-105"
                                        >
                                            Register Unit
                                        </button>
                                    )}
                                    <p className="mt-4 text-xs text-slate-500 uppercase">Note: Matches are simulated asynchronously. Results will be sent to your inbox.</p>
                                </div>
                            )
                        ) : (
                            <div className="text-slate-600 uppercase tracking-widest">Select a tournament to view details</div>
                        )}
                    </div>
                </>
            )}
        </div>
    </div>
  );
};

export default TournamentView;
