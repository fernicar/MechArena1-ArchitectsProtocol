
import React, { useState, useEffect, useRef } from 'react';
import { MechBuild, EnemyProfile, BattleResult, Rival } from '../types';
import { playSound } from '../services/audioService';
import StatsDisplay from './StatsDisplay';
import ArenaHUD from './arena/ArenaHUD';
import ArenaControls from './arena/ArenaControls';
import ArenaCanvas from './arena/ArenaCanvas';
import BattleTelemetry from './arena/BattleTelemetry';
import { generateRivalBuild } from '../utils/procGen';

interface ArenaProps {
  playerBuild: MechBuild;
  enemies: EnemyProfile[];
  rivals?: Rival[];
  replayData?: BattleResult | null;
  onStartBattle: (enemy: EnemyProfile, arenaType: string) => Promise<void>;
  onExit: () => void;
}

const Arena: React.FC<ArenaProps> = ({ playerBuild, enemies, rivals = [], replayData, onStartBattle, onExit }) => {
  const [selectedEnemy, setSelectedEnemy] = useState<EnemyProfile | null>(null);
  const [selectedArena, setSelectedArena] = useState<string>('OPEN');
  const [simulating, setSimulating] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [activeTab, setActiveTab] = useState<'SIMULATION' | 'RANKED'>('SIMULATION');
  
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showResultOverlay, setShowResultOverlay] = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(false);
  
  const logContainerRef = useRef<HTMLDivElement>(null);

  // When replay data is provided (either from Mail or just simulated), start playback
  useEffect(() => {
    if (replayData) {
        setBattleResult(replayData);
        setSimulating(false);
        setIsPlaying(true);
        setCurrentFrameIdx(0);
        setShowResultOverlay(false);
    }
  }, [replayData]);

  // Scroll log to bottom
  useEffect(() => {
      if (logContainerRef.current) {
          logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
  }, [currentFrameIdx]);

  const handleSelectRival = (rival: Rival) => {
      playSound('UI_HOVER');
      try {
          const build = generateRivalBuild(rival);
          
          const enemyProfile: EnemyProfile = {
              id: rival.id,
              name: rival.name,
              description: `Ranked Pilot. Rating: ${rival.rating}`,
              difficulty: 'RANKED',
              reward: Math.floor(rival.rating * 5),
              rating: rival.rating,
              rd: 50,
              build: build
          };
          setSelectedEnemy(enemyProfile);
      } catch (error) {
          console.error("Error generating rival build:", error);
      }
  };

  const handleInitiate = async () => {
    if (!selectedEnemy) return;
    playSound('UI_CLICK');
    setSimulating(true);
    await onStartBattle(selectedEnemy, selectedArena);
    // Note: onStartBattle will eventually update replayData prop, triggering the effect above.
  };

  const handleBattleFinish = () => {
      setIsPlaying(false);
      setShowResultOverlay(true);
  };

  const visibleLogEvents = battleResult?.frames
    .slice(Math.max(0, currentFrameIdx - 60), currentFrameIdx + 1)
    .flatMap(f => f.events.map(e => ({ ...e, tick: f.tick })))
    .reverse() || [];

  // If we are simulating or have a result to show, render the battle view
  if (simulating || battleResult) {
      if (simulating) {
          return (
              <div className="flex h-full w-full bg-slate-950 items-center justify-center flex-col">
                  <div className="text-2xl text-cyan-500 font-mono animate-pulse tracking-widest">CALCULATING COMBAT SIMULATION...</div>
                  <div className="w-64 h-2 bg-slate-800 mt-4 rounded overflow-hidden">
                      <div className="h-full bg-cyan-500 animate-[width_2s_ease-in-out_infinite]" style={{width: '50%'}}></div>
                  </div>
              </div>
          );
      }

      const isVictory = battleResult?.winner === 'PLAYER';

      return (
        <div className="flex flex-col h-full bg-black relative">
            <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
                {/* Center Viewport: Canvas */}
                <div className="flex-1 flex items-center justify-center bg-slate-900 overflow-hidden relative border-r border-slate-800">
                    <ArenaHUD 
                        playerBuild={playerBuild} 
                        selectedEnemy={selectedEnemy} 
                        currentFrame={battleResult?.frames[currentFrameIdx]}
                        battleResult={battleResult}
                    />

                    <ArenaCanvas 
                        battleResult={battleResult}
                        currentFrameIdx={currentFrameIdx}
                        isPlaying={isPlaying}
                        playbackSpeed={playbackSpeed}
                        setCurrentFrameIdx={setCurrentFrameIdx}
                        setIsPlaying={setIsPlaying}
                        onFinish={handleBattleFinish}
                        isReplay={true}
                    />

                    {/* Telemetry Overlay */}
                    {showTelemetry && battleResult && (
                        <div className="absolute inset-0 z-30 bg-black/90 p-4 animate-fade-in">
                            <BattleTelemetry 
                                battleResult={battleResult} 
                                currentFrameIdx={currentFrameIdx}
                                onSeek={(frame) => {
                                    setIsPlaying(false);
                                    setCurrentFrameIdx(frame);
                                }}
                            />
                            <div className="absolute top-2 right-2 text-slate-500 text-[10px] uppercase">Telemetry Mode Active</div>
                        </div>
                    )}

                    {/* Result Overlay */}
                    {showResultOverlay && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40 animate-fade-in backdrop-blur-sm">
                            <div className="text-center transform scale-110">
                                <h2 className={`text-6xl md:text-8xl font-black italic tracking-tighter mb-4 drop-shadow-[0_0_25px_rgba(0,0,0,0.8)]
                                    ${isVictory ? 'text-green-500' : 'text-red-500'}
                                `}>
                                    {isVictory ? 'VICTORY' : 'DEFEAT'}
                                </h2>
                                <div className="h-1 w-full bg-white/20 mb-8"></div>
                                <div className="flex gap-4 justify-center">
                                    <button 
                                        onClick={() => {
                                            setCurrentFrameIdx(0);
                                            setShowResultOverlay(false);
                                            setIsPlaying(true);
                                        }}
                                        className="px-6 py-3 border border-slate-500 text-slate-300 hover:bg-slate-800 hover:text-white uppercase font-bold tracking-widest text-sm"
                                    >
                                        Replay
                                    </button>
                                    <button 
                                        onClick={onExit}
                                        className={`px-8 py-3 font-bold uppercase tracking-widest text-sm shadow-lg
                                            ${isVictory ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}
                                        `}
                                    >
                                        Return to Base
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Logs */}
                <div className="w-full h-32 md:h-full md:w-64 bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col z-10">
                    <div className="p-2 bg-slate-900 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex justify-between items-center">
                        <span>System Log</span>
                        <span className="text-[10px] text-slate-600 font-mono">REC</span>
                    </div>
                    <div ref={logContainerRef} className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
                        {visibleLogEvents.map((e, i) => (
                            <div key={i} className={`p-1 border-l-2 pl-2 ${
                                e.type === 'HIT' ? 'border-red-500 text-red-300' : 
                                e.type === 'AI_DECISION' ? 'border-purple-500 text-purple-300' : 
                                'border-slate-600 text-slate-400'
                            }`}>
                                <span className="opacity-50 mr-2">T{e.tick}</span>
                                {e.type === 'FIRE' && `> ${e.sourceId} WEAPON DISCHARGE`}
                                {e.type === 'HIT' && `> ${e.targetId} DAMAGED: -${Math.floor(e.damage || 0)}`}
                                {e.type === 'WALL_COLLISION' && `> PROJ. BLOCKED BY TERRAIN`}
                                {e.type === 'DESTROYED' && `> ${e.targetId} SIGNAL LOST`}
                                {e.type === 'MELEE_HIT' && `> ${e.targetId} CRITICAL STRIKE`}
                                {e.type === 'SHIELD_BLOCK' && `> DAMAGE MITIGATED`}
                                {e.type === 'STAGGER_BREAK' && `> ${e.targetId} ACS OVERLOAD`}
                                {e.type === 'AI_DECISION' && `> ${e.sourceId} AI: ${e.message}`}
                            </div>
                        ))}
                        <div className="h-4"></div> 
                    </div>
                </div>
            </div>

            <ArenaControls 
                currentFrameIdx={currentFrameIdx}
                totalFrames={battleResult?.frames.length || 0}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                battleResult={battleResult}
                isReplay={true} 
                showTelemetry={showTelemetry}
                onSeek={(frame) => {
                    setIsPlaying(false);
                    setCurrentFrameIdx(frame);
                    if (frame >= (battleResult?.frames.length || 0) - 1) {
                        handleBattleFinish();
                    } else {
                        setShowResultOverlay(false);
                    }
                    playSound('UI_HOVER');
                }}
                onPlayPause={() => {
                    if (showResultOverlay) {
                        setCurrentFrameIdx(0);
                        setShowResultOverlay(false);
                        setIsPlaying(true);
                    } else {
                        setIsPlaying(!isPlaying);
                    }
                    playSound('UI_CLICK');
                }}
                onRestart={() => {
                    setCurrentFrameIdx(0);
                    setShowResultOverlay(false);
                    setIsPlaying(true);
                    playSound('UI_CLICK');
                }}
                onSpeedChange={setPlaybackSpeed}
                onToggleTelemetry={() => {
                    setShowTelemetry(!showTelemetry);
                    playSound('UI_CLICK');
                }}
                onEnd={onExit}
            />
        </div>
      );
  }

  // Matchmaking / Enemy Selection View
  return (
      <div className="flex flex-col h-full bg-slate-950 p-6 overflow-hidden">
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
            <div>
                <h1 className="text-3xl font-bold text-red-500 uppercase tracking-widest glow-text">Arena Matchmaking</h1>
                <div className="flex gap-4 mt-2">
                    <button 
                        onClick={() => setActiveTab('SIMULATION')}
                        className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-colors ${activeTab === 'SIMULATION' ? 'border-red-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        Simulation Data
                    </button>
                    <button 
                        onClick={() => setActiveTab('RANKED')}
                        className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-colors ${activeTab === 'RANKED' ? 'border-yellow-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        Ranked Ladder
                    </button>
                </div>
            </div>
            <button onClick={onExit} className="text-slate-400 hover:text-white uppercase text-sm">Return to Hangar</button>
        </header>
        
        <div className="flex flex-1 gap-8 overflow-hidden flex-col md:flex-row">
            <div className="w-full md:w-1/3 overflow-y-auto pr-2 space-y-2">
                {activeTab === 'SIMULATION' ? (
                    <>
                        <button 
                            onClick={() => {
                                const random = enemies[Math.floor(Math.random() * enemies.length)];
                                setSelectedEnemy(random);
                                playSound('UI_HOVER');
                            }}
                            className="w-full p-4 border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-cyan-500 hover:bg-slate-900 transition-all uppercase tracking-widest text-sm font-bold flex items-center justify-center gap-2 mb-4"
                        >
                            <span>🎲</span> Random Simulation
                        </button>
                        {enemies.map(enemy => (
                            <div 
                                key={enemy.id}
                                onClick={() => { playSound('UI_HOVER'); setSelectedEnemy(enemy); }}
                                className={`p-4 border-l-4 cursor-pointer transition-all bg-gradient-to-r ${selectedEnemy?.id === enemy.id ? 'border-red-500 from-red-900/20 to-transparent' : 'border-slate-700 from-slate-900 to-transparent hover:from-slate-800'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-lg text-white">{enemy.name}</h3>
                                    <span className="text-[10px] bg-slate-800 px-2 py-1 rounded border border-slate-700">{enemy.difficulty}</span>
                                </div>
                                <p className="text-xs text-slate-400 mb-2">{enemy.description}</p>
                                <div className="flex justify-between text-xs font-mono text-slate-500">
                                    <span>RATING: {enemy.rating}</span>
                                    <span className="text-yellow-500">{enemy.reward.toLocaleString()} C</span>
                                </div>
                            </div>
                        ))}
                    </>
                ) : (
                    rivals.map(rival => (
                        <div 
                            key={rival.id}
                            onClick={() => handleSelectRival(rival)}
                            className={`p-4 border-l-4 cursor-pointer transition-all bg-gradient-to-r ${selectedEnemy?.id === rival.id ? 'border-yellow-500 from-yellow-900/20 to-transparent' : 'border-slate-800 from-slate-900 to-transparent hover:from-slate-800'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-lg text-white">{rival.name}</h3>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-500">AC</div>
                                    <div className="text-xs font-bold text-cyan-400">{rival.mechName}</div>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs font-mono text-slate-500 mt-2">
                                <span className="flex items-center gap-1">
                                    RATING: <span className="text-white font-bold">{rival.rating}</span>
                                    {rival.trend === 'UP' && <span className="text-green-500 text-[10px]">▲</span>}
                                    {rival.trend === 'DOWN' && <span className="text-red-500 text-[10px]">▼</span>}
                                </span>
                                <span className="text-yellow-500">{Math.floor(rival.rating * 5).toLocaleString()} C</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="flex-1 bg-slate-900/50 border border-slate-700 p-8 flex flex-col items-center justify-center relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>

                {selectedEnemy ? (
                    <div className="w-full max-w-2xl text-center relative z-10 animate-fade-in">
                        <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">TARGET LOCKED</div>
                        <h2 className="text-4xl font-bold text-white mb-2 uppercase">{selectedEnemy.name}</h2>
                        
                        {activeTab === 'RANKED' && (
                            <div className="mb-4 text-cyan-400 font-mono text-sm">
                                AC: {selectedEnemy.build.name}
                            </div>
                        )}

                        <StatsDisplay stats={selectedEnemy.build.stats} compact />
                        
                        {/* Map Selector */}
                        <div className="my-6 w-full bg-slate-800 p-3 border border-slate-600 flex items-center justify-between">
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">COMBAT ZONE:</span>
                            <select 
                                value={selectedArena}
                                onChange={(e) => setSelectedArena(e.target.value)}
                                className="bg-slate-900 text-white text-sm border border-slate-700 px-3 py-1 uppercase outline-none focus:border-cyan-500 cursor-pointer"
                            >
                                <option value="OPEN">Standard Open Field</option>
                                <option value="PILLARS">Pillar Ruins</option>
                                <option value="URBAN">Urban Sector</option>
                                <option value="WASTELAND">Wasteland</option>
                            </select>
                        </div>

                        <button 
                            onClick={handleInitiate}
                            className={`w-full py-4 font-bold text-xl uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-transform hover:scale-105 text-white
                                ${activeTab === 'RANKED' ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/50' : 'bg-red-600 hover:bg-red-500 shadow-red-900/50'}
                            `}
                        >
                            {activeTab === 'RANKED' ? 'CHALLENGE RIVAL' : 'INITIATE SIMULATION'}
                        </button>
                    </div>
                ) : (
                    <div className="text-slate-600 uppercase tracking-widest text-sm flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        Select a target from the list
                    </div>
                )}
            </div>
        </div>
      </div>
  );
};

export default Arena;
