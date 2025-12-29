
import React, { useState, useEffect } from 'react';
import { useGameStore } from './store';
import * as storage from './services/storageService';
import { ENEMIES, DEBUG_MODE } from './constants';
import { generateRivals } from './utils/generators';
import { initAudio, playSound } from './services/audioService';
import { BattleResult, EnemyProfile, Mail } from './types';
import { calculateRatingChange, getRankFromRating } from './utils/glicko';
import { generateBattleReport, simulateBattleInCloud } from './services/geminiService';
import Splash from './components/Splash';
import Hangar from './components/Hangar';
import Garage from './components/Garage';
import AILab from './components/AILab';
import Arena from './components/Arena';
import TournamentView from './components/Tournament';
import MailClient from './components/MailClient';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import VersusScreen from './components/VersusScreen';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('SPLASH'); // SPLASH, HANGAR, GARAGE, AILAB, ARENA, TOURNAMENT, MAIL, PROFILE, SETTINGS, VERSUS
  const [hasApiKey, setHasApiKey] = useState(false);

  // Note: We use getState() in async functions to ensure we have the latest state values
  const { 
    mechs,
    activeMechId,
    profile, 
    addCredits, 
    updateProfile, 
    addMail, 
    setGameState,
    addLog,
    rivals,
    setRivals,
    simulateRivalActivity,
    debugSettings,
    createNewMech
  } = useGameStore();

  const activeMech = activeMechId && mechs[activeMechId] ? mechs[activeMechId] : null;

  const [unlockedEnemies, setUnlockedEnemies] = useState<EnemyProfile[]>(ENEMIES);
  const [replayData, setReplayData] = useState<BattleResult | null>(null);
  
  // Versus Screen State
  const [versusEnemy, setVersusEnemy] = useState<EnemyProfile | null>(null);
  const [pendingBattleResult, setPendingBattleResult] = useState<BattleResult | null>(null);

  useEffect(() => {
    const initData = async () => {
        try {
            const data = await storage.loadFullGameData();
            // Validate before setting state to avoid render crashes
            if (!data.profile || !data.activeMechId || !data.mechs[data.activeMechId]) {
               console.warn("Loaded data appears invalid:", data);
            }
            
            // Generate rivals if first run
            let loadedRivals = data.rivals || [];
            if (loadedRivals.length === 0) {
                loadedRivals = generateRivals(50);
            }

            setGameState({
              credits: data.credits,
              mechs: data.mechs,
              activeMechId: data.activeMechId,
              ownedPartIds: new Set(data.ownedPartIds), // Fix: convert array back to Set
              profile: data.profile,
              mails: data.mails,
              userChips: data.userChips,
              rivals: loadedRivals
            });
            setLoading(false);
        } catch (e) {
            console.error("Failed to initialize game data", e);
            setLoading(false);
        }
    };
    initData();

    const initHandler = () => {
        initAudio();
        window.removeEventListener('click', initHandler);
    };
    window.addEventListener('click', initHandler);

    const checkKey = async () => {
        if (DEBUG_MODE || debugSettings.enabled) {
            console.log("DEBUG MODE: Bypassing API Key check");
            setHasApiKey(true);
            if (view === 'SPLASH') setView('HANGAR'); // Auto enter only if still on splash
            return;
        }

        if ((window as any).aistudio) {
            const has = await (window as any).aistudio.hasSelectedApiKey();
            setHasApiKey(has);
            if (has && view === 'SPLASH') setView('HANGAR');
        }
    };
    checkKey();

    return () => window.removeEventListener('click', initHandler);
  }, [setGameState, debugSettings.enabled]);

  const handleApiConnect = async () => {
      playSound('UI_CLICK');
      try {
          if ((window as any).aistudio) {
              await (window as any).aistudio.openSelectKey();
              setHasApiKey(true);
              setView('HANGAR');
          } else {
              alert("AI Studio environment not detected.");
              // Fallback for dev without AI Studio extension
              setHasApiKey(true);
              setView('HANGAR');
          }
      } catch (e) {
          console.error("API Key selection failed", e);
      }
  };

  const handleCreateNewMech = () => {
      createNewMech();
      playSound('UI_CLICK');
      setView('GARAGE'); // UX Improvement: Auto-enter garage
  };

  // Helper to process battle results, save to mail, and return the data
  const processBattleResult = async (
      result: BattleResult, 
      enemy: EnemyProfile, 
      isTournament: boolean, 
      prize: number = 0,
      customBody?: string
    ): Promise<BattleResult> => {
      // Access fresh state to avoid stale closure issues during async simulation
      const currentStore = useGameStore.getState();
      const currentProfile = currentStore.profile;
      const currentMech = currentStore.mechs[currentStore.activeMechId!] || activeMech;
      const currentDebug = currentStore.debugSettings;

      if (!currentMech || !currentProfile) throw new Error("Missing profile or mech");

      const isWin = result.winner === 'PLAYER';
      const today = new Date().toISOString().split('T')[0];
      
      let xpGain = isTournament ? 100 : 25; // Base XP
      
      if (isWin) {
          // Debug: Instant Level Up Logic
          if (currentDebug.enabled && currentDebug.instantLevelUp) {
              // Calculate remaining XP needed for next level exactly
              const needed = Math.max(0, currentProfile.nextLevelExp - currentProfile.exp);
              xpGain = Math.ceil(needed); 
              console.log(`[DEBUG] Instant Level Up Triggered. Needed: ${needed}, Granting: ${xpGain}`);
          } else {
              xpGain += isTournament ? 100 : 50; // Win Bonus
              if (currentProfile.lastWinDate !== today) {
                  xpGain += 200; // Daily Bonus
              }
          }
      }

      // Rating updates (only for tournaments or rival matches)
      // Allow rival matches to affect rating too
      let newRating = { rating: currentProfile.rating, rd: currentProfile.rd, vol: currentProfile.vol };
      let ratingChange = 0;
      
      // If it's a tournament OR a ranked rival match (enemy has difficulty 'RANKED')
      if (isTournament || enemy.difficulty === 'RANKED') {
          newRating = calculateRatingChange(
              { rating: currentProfile.rating, rd: currentProfile.rd, vol: currentProfile.vol },
              { rating: enemy.rating, rd: enemy.rd, vol: 0.06 },
              isWin ? 1 : 0
          );
          ratingChange = newRating.rating - currentProfile.rating;
          
          // Trigger world simulation
          simulateRivalActivity();
      }

      // Prepare data
      const fullResult: BattleResult = {
          ...result,
          enemyName: enemy.name,
          reward: isWin ? (isTournament ? prize : enemy.reward) : 0,
          date: new Date().toLocaleDateString(),
          ratingChange: ratingChange,
          tournamentId: result.tournamentId
      };

      const narrative = await generateBattleReport(fullResult, currentMech);
      const ratingSign = ratingChange >= 0 ? '+' : '';

      // Level Up Calculation
      let currentExp = currentProfile.exp + xpGain;
      let currentLevel = currentProfile.level;
      let currentNextLevelExp = currentProfile.nextLevelExp;
      let leveledUp = false;

      while (currentExp >= currentNextLevelExp) {
          currentExp -= currentNextLevelExp;
          currentLevel++;
          currentNextLevelExp = Math.floor(currentNextLevelExp * 1.5);
          leveledUp = true;
      }

      // Construct Mail Body
      let bodyText = "";
      if (customBody) {
          // If custom body provided (Tournament Bracket Log), append standard details
          bodyText = `# TOURNAMENT REPORT\n\n${customBody}\n\n---\n**RATING UPDATE**: ${currentProfile.rating} -> ${newRating.rating} (${ratingSign}${ratingChange})\n**XP EARNED**: ${xpGain} XP\n\n### COMBAT ANALYSIS (FINAL MATCH)\n${narrative}`;
          if (isWin && prize > 0) bodyText += `\n\n> PRIZE: **${prize.toLocaleString()} C** transferred.`;
      } else {
          // Standard Battle Body
          bodyText = (isTournament || enemy.difficulty === 'RANKED')
              ? `# MATCH REPORT\n**OPPONENT**: ${enemy.name} (${enemy.difficulty})\n\n* **RESULT**: ${isWin ? 'VICTORY' : 'DEFEAT'}\n* **RATING UPDATE**: ${currentProfile.rating} -> ${newRating.rating} (${ratingSign}${ratingChange})\n* **XP EARNED**: ${xpGain} XP\n\n### COMMENTARY\n${narrative}\n\n${isWin && fullResult.reward ? `> PRIZE: **${fullResult.reward} C** transferred.` : ''}`
              : `## SIMULATION LOG // ${fullResult.date}\n\n* **RESULT**: ${isWin ? 'VICTORY' : 'DEFEAT'}\n* **OPPONENT**: ${enemy.name}\n* **REWARD**: ${fullResult.reward} C\n* **XP EARNED**: ${xpGain} XP\n\n### ANALYTICS\n${narrative}\n\n_Note: Test matches do not affect Pilot Rating._`;
      }

      if (leveledUp) {
          bodyText += `\n\n**SYSTEM ALERT**: PILOT LEVEL UP! (LVL ${currentLevel})\nCheck Profile for new access clearances.`;
      }

      // Construct Mail
      const newMail: Mail = {
          id: `m_${Date.now()}`,
          sender: isTournament ? 'TOURNAMENT HOST' : 'ARENA SYS',
          subject: `${isTournament || enemy.difficulty === 'RANKED' ? 'MATCH RESULT' : 'SIMULATION'}: ${isWin ? 'VICTORY' : 'DEFEAT'} vs ${enemy.name}`,
          preview: `${isWin ? 'Target neutralized.' : 'Mission failed.'} Rewards attached.`,
          body: bodyText,
          timestamp: new Date().toISOString(),
          read: false,
          type: isTournament ? 'TOURNAMENT' : 'BATTLE',
          battleResult: fullResult
      };

      // Commit State
      addMail(newMail);
      addLog(`${isTournament ? 'Tournament' : enemy.difficulty === 'RANKED' ? 'Ranked Match' : 'Test Match'}: ${isWin ? 'VICTORY' : 'DEFEAT'} vs ${enemy.name}`);

      updateProfile({
          wins: ((isTournament || enemy.difficulty === 'RANKED') && isWin) ? currentProfile.wins + 1 : currentProfile.wins,
          losses: ((isTournament || enemy.difficulty === 'RANKED') && !isWin) ? currentProfile.losses + 1 : currentProfile.losses,
          rating: newRating.rating,
          rd: newRating.rd,
          rank: getRankFromRating(newRating.rating),
          exp: currentExp,
          level: currentLevel,
          nextLevelExp: currentNextLevelExp,
          lastWinDate: isWin ? today : currentProfile.lastWinDate
      });

      if (isWin && fullResult.reward) {
          addCredits(fullResult.reward);
          playSound('UI_CLICK');
      } else {
          playSound(isWin ? 'UI_CLICK' : 'ALARM');
      }

      return fullResult;
  };

  const handleStartBattle = async (enemy: EnemyProfile, arenaType: string) => {
      if (!activeMech) return;
      
      // 1. Enter Versus Screen immediately
      setVersusEnemy(enemy);
      setView('VERSUS');
      setPendingBattleResult(null);

      // 2. Start Simulation in Background
      simulateBattleInCloud(activeMech, enemy.build, arenaType).then(async (result) => {
          if (!result) return;
          // 3. Process the result logic (mails, ratings) while user watches versus screen
          const isRanked = enemy.difficulty === 'RANKED';
          await processBattleResult(result, enemy, false, 0);
          setPendingBattleResult(result);
      });
  };

  const handleVersusReady = () => {
      // Called by VersusScreen when animations finish
      if (pendingBattleResult) {
          setReplayData(pendingBattleResult);
          setView('ARENA');
      } else {
          // If simulation is slower than animation, we might need a small loader or just wait
          // For now, let's just assume it's fast enough or check interval
          const check = setInterval(() => {
              // This relies on closure state which might be stale in interval, but 
              // we can re-check via a ref if needed. 
              // React state update in then() block above will trigger re-render.
              // A better pattern for this simple app: just wait for user to click "Start" on Versus screen?
              // The current VersusScreen calls onReady automatically.
          }, 100);
          
          // Safety: If it takes too long, we just wait. The setPendingBattleResult will trigger a re-render if we used it, 
          // but we aren't using it in the render loop for transition.
          // Let's rely on the user interface state. 
          // Actually, if pendingBattleResult is null, let's keep showing VERSUS until it is ready.
          // We can modify VersusScreen to accept the result readiness.
      }
  };

  const handleTournamentRegister = async (tournament: any) => {
      if (!activeMech) return;

      // 1. Bracket Setup: Select 7 Rivals + Player
      // Filter rivals by rating approximation for the league
      const minRating = tournament.prizePool / 100;
      let eligibleRivals = rivals.filter(r => r.rating >= minRating && r.rating <= minRating + 800);
      
      // Fallback: If not enough eligible rivals, use general pool
      if (eligibleRivals.length < 7) {
          eligibleRivals = [...rivals];
      }

      // Fallback 2: If still not enough (e.g., fresh save), fill with placeholders
      while (eligibleRivals.length < 7) {
          const id = eligibleRivals.length + 1;
          eligibleRivals.push({
              id: `mercenary_${id}`,
              name: `MERCENARY-${id}`,
              mechName: `UNKNOWN-${id}`,
              rating: 1500,
              trend: 'SAME'
          });
      }
      
      // Shuffle and pick 7
      const shuffled = [...eligibleRivals].sort(() => 0.5 - Math.random());
      const participants = shuffled.slice(0, 7).map(r => ({
          ...r,
          profile: {
              id: r.id,
              name: r.name,
              description: `Ranked opponent. Mech: ${r.mechName}`,
              difficulty: 'RANKED',
              rating: r.rating,
              rd: 100,
              build: { ...ENEMIES[0].build, name: r.mechName } // In a real app, we'd generate unique builds
          } as EnemyProfile
      }));

      // Critical Check
      if (participants.length < 1 || !participants[0].profile) {
          console.error("Tournament Error: Insufficient participants generated.");
          alert("Matchmaking Error: Not enough opponents found. Try again.");
          return;
      }

      // Bracket Logs
      const bracketLog: string[] = [];
      let playerEliminated = false;
      let finalResult: BattleResult | null = null;
      let finalEnemy: EnemyProfile | null = null;
      let prizeMoney = 0;

      // Helper for CPU vs CPU
      const simMatch = (r1: any, r2: any) => {
          // Probability based on rating diff
          const ratingDiff = r1.rating - r2.rating;
          const winProb = 1 / (1 + Math.pow(10, -ratingDiff / 400));
          return Math.random() < winProb ? r1 : r2;
      };

      // --- ROUND 1: QUARTER FINALS ---
      // Player vs Participant 0
      const round1Enemy = participants[0].profile;
      const r1Result = await simulateBattleInCloud(activeMech, round1Enemy.build);

      if (!r1Result) return; // Error case

      if (r1Result.winner === 'ENEMY') {
          playerEliminated = true;
          finalResult = r1Result;
          finalEnemy = round1Enemy;
          bracketLog.push(`**Quarter-Finals**: DEFEAT vs ${round1Enemy.name}.`);
      } else {
          bracketLog.push(`**Quarter-Finals**: VICTORY vs ${round1Enemy.name}.`);
          finalResult = r1Result; // Keep track of latest valid result
          finalEnemy = round1Enemy;
      }

      // Sim other QF matches
      // QF2: P1 vs P2, QF3: P3 vs P4, QF4: P5 vs P6
      const qf2Winner = simMatch(participants[1], participants[2]);
      const qf3Winner = simMatch(participants[3], participants[4]);
      const qf4Winner = simMatch(participants[5], participants[6]);

      // --- ROUND 2: SEMI FINALS ---
      if (!playerEliminated) {
           const round2Enemy = qf2Winner.profile;
           const r2Result = await simulateBattleInCloud(activeMech, round2Enemy.build);
           
           if (!r2Result) return;

           if (r2Result.winner === 'ENEMY') {
               playerEliminated = true;
               finalResult = r2Result;
               finalEnemy = round2Enemy;
               bracketLog.push(`**Semi-Finals**: DEFEAT vs ${round2Enemy.name}.`);
               prizeMoney = tournament.prizePool * 0.25; // Small consolation?
           } else {
               bracketLog.push(`**Semi-Finals**: VICTORY vs ${round2Enemy.name}.`);
               finalResult = r2Result;
               finalEnemy = round2Enemy;
           }
      }

      const sf2Winner = simMatch(qf3Winner, qf4Winner);

      // --- ROUND 3: FINALS ---
      if (!playerEliminated) {
          const round3Enemy = sf2Winner.profile;
          const r3Result = await simulateBattleInCloud(activeMech, round3Enemy.build);

          if (!r3Result) return;

          if (r3Result.winner === 'ENEMY') {
              playerEliminated = true;
              finalResult = r3Result;
              finalEnemy = round3Enemy;
              bracketLog.push(`**FINALS**: DEFEAT vs ${round3Enemy.name}. 2nd Place.`);
              prizeMoney = tournament.prizePool * 0.5; // Runner up prize
          } else {
              bracketLog.push(`**FINALS**: VICTORY vs ${round3Enemy.name}. **TOURNAMENT CHAMPION!**`);
              finalResult = r3Result;
              finalEnemy = round3Enemy;
              prizeMoney = tournament.prizePool;
          }
      }

      // Process Final Outcome
      if (finalResult && finalEnemy) {
          finalResult.tournamentId = tournament.id;
          const bracketSummary = bracketLog.join('\n');
          await processBattleResult(finalResult, finalEnemy, true, prizeMoney, bracketSummary);
      }
  };

  if (loading) return <div className="h-screen w-screen bg-black text-white flex items-center justify-center font-mono">LOADING SYSTEM...</div>;

  return (
    <div className="h-screen w-screen overflow-hidden text-slate-200 font-sans selection:bg-cyan-500/30">
        {view === 'SPLASH' && <Splash onConnect={handleApiConnect} />}
        {view === 'HANGAR' && <Hangar onNavigate={setView as any} />}
        {view === 'GARAGE' && <Garage onExit={() => setView('HANGAR')} onTest={() => setView('ARENA')} />}
        {view === 'AILAB' && <AILab onExit={() => setView('HANGAR')} />}
        {view === 'ARENA' && (
            <Arena 
                playerBuild={activeMech!} 
                enemies={unlockedEnemies} 
                rivals={rivals} // Added prop
                replayData={replayData}
                onStartBattle={handleStartBattle}
                onExit={() => { setReplayData(null); setView('HANGAR'); }}
            />
        )}
        {view === 'TOURNAMENT' && <TournamentView onRegister={handleTournamentRegister} onExit={() => setView('HANGAR')} />}
        {view === 'MAIL' && <MailClient onClose={() => setView('HANGAR')} onViewReplay={(mail) => { if(mail.battleResult) { setReplayData(mail.battleResult); setView('ARENA'); } }} />}
        {view === 'PROFILE' && <ProfileView onExit={() => setView('HANGAR')} />}
        {view === 'SETTINGS' && <SettingsView onExit={() => setView('HANGAR')} />}
        
        {/* Versus Overlay - Rendered conditionally but keeps state if we wanted to animate out */}
        {view === 'VERSUS' && activeMech && versusEnemy && (
            <VersusScreen 
                playerBuild={activeMech}
                enemyProfile={versusEnemy}
                onReady={handleVersusReady}
            />
        )}
    </div>
  );
};

export default App;
