
import { create } from 'zustand';
import { MechBuild, PlayerProfile, Mail, AIChip, Rival, DebugSettings, MechPart } from './types';
import { STARTER_BUILD, INITIAL_CREDITS } from './constants';
import * as storage from './services/storageService';

interface GameState {
  credits: number;
  mechs: Record<string, MechBuild>;
  activeMechId: string | null;
  ownedPartIds: Set<string>;
  profile: PlayerProfile;
  mails: Mail[];
  userChips: AIChip[];
  rivals: Rival[];
  systemLogs: string[];
  debugSettings: DebugSettings;

  addCredits: (amount: number) => void;
  updateProfile: (updates: Partial<PlayerProfile>) => void;
  addMail: (mail: Mail) => void;
  setGameState: (data: Partial<GameState>) => void;
  addLog: (msg: string) => void;
  setRivals: (rivals: Rival[]) => void;
  simulateRivalActivity: () => void;
  
  updateMech: (mech: MechBuild) => void;
  createNewMech: () => void;
  deleteMech: (id: string) => void;
  buyPart: (part: MechPart) => void;
  setActiveMech: (id: string) => void;
  saveUserChip: (chip: AIChip) => void;
  deleteUserChip: (id: string) => void;
  markMailRead: (id: string) => void;
  deleteMail: (id: string) => void;
  markAllRead: () => void;
  deleteReadMails: () => void;
  setDebugSettings: (settings: Partial<DebugSettings>) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  credits: INITIAL_CREDITS,
  mechs: { [STARTER_BUILD.id]: STARTER_BUILD },
  activeMechId: STARTER_BUILD.id,
  ownedPartIds: new Set(Object.values(STARTER_BUILD.parts).map(p => p.id)),
  profile: {
      name: 'ARCHITECT',
      rank: 'E',
      rating: 1500,
      rd: 350,
      vol: 0.06,
      level: 1,
      exp: 0,
      wins: 0,
      losses: 0,
      nextLevelExp: 1000,
      lastWinDate: ''
  },
  mails: [],
  userChips: [],
  rivals: [],
  systemLogs: [
      "System Initialized...",
      "Connected to Neural Net.",
      "Market Data Updated.",
      "Weather Control: CLEAR",
      "Welcome, Architect."
  ],
  debugSettings: {
    enabled: true,
    unlockAllParts: true,
    unlockAllChips: true,
    unlockTree: true,
    instantLevelUp: true
  },

  setGameState: (data) => set((state) => ({ ...state, ...data })),
  
  addCredits: (amount) => set((state) => {
      const newCredits = state.credits + amount;
      storage.saveGameState('credits', newCredits);
      return { credits: newCredits };
  }),

  updateProfile: (updates) => set((state) => {
      const newProfile = { ...state.profile, ...updates };
      storage.saveGameState('profile', newProfile);
      return { profile: newProfile };
  }),

  addMail: (mail) => set((state) => {
      const newMails = [mail, ...state.mails];
      storage.saveMail(mail);
      return { mails: newMails };
  }),

  addLog: (msg) => set((state) => ({ systemLogs: [msg, ...state.systemLogs].slice(0, 50) })),

  setRivals: (rivals) => {
      storage.saveGameState('rivals', rivals);
      set({ rivals });
  },

  simulateRivalActivity: () => set((state) => {
      const newRivals = state.rivals.map(r => {
          if (Math.random() > 0.7) {
              const change = Math.floor(Math.random() * 50) - 20;
              return { 
                  ...r, 
                  rating: Math.max(800, r.rating + change),
                  trend: (change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'SAME') as 'UP' | 'DOWN' | 'SAME'
              };
          }
          return r;
      }).sort((a, b) => b.rating - a.rating);
      storage.saveGameState('rivals', newRivals);
      return { rivals: newRivals };
  }),

  updateMech: (mech) => set((state) => {
      const newMechs = { ...state.mechs, [mech.id]: mech };
      storage.saveGameState('mechs', newMechs);
      return { mechs: newMechs };
  }),

  createNewMech: () => set((state) => {
      const newId = `mech_${Date.now()}`;
      const newMech = { ...STARTER_BUILD, id: newId, name: `NEW UNIT ${Object.keys(state.mechs).length + 1}` };
      const newMechs = { ...state.mechs, [newId]: newMech };
      storage.saveGameState('mechs', newMechs);
      return { mechs: newMechs, activeMechId: newId };
  }),

  deleteMech: (id) => set((state) => {
      const mechCount = Object.keys(state.mechs).length;
      console.log(`[Store] Attempting to delete mech ${id}. Total mechs: ${mechCount}`);

      // Logic: Cannot delete the last mech
      if (mechCount <= 1) {
          console.warn("[Store] Prevented deletion of last mech.");
          return state;
      }

      // Create new object copy
      const newMechs = { ...state.mechs };
      delete newMechs[id];
      
      let newActiveId = state.activeMechId;
      
      // If we deleted the active mech, switch to the first available one
      if (state.activeMechId === id) {
          const remainingIds = Object.keys(newMechs);
          newActiveId = remainingIds.length > 0 ? remainingIds[0] : null;
      }

      // Persist immediately
      storage.saveGameState('mechs', newMechs);
      if (newActiveId) {
          storage.saveGameState('activeMechId', newActiveId);
      }

      console.log(`[Store] Mech deleted. New active ID: ${newActiveId}`);
      return { mechs: newMechs, activeMechId: newActiveId };
  }),

  setActiveMech: (id) => {
      storage.saveGameState('activeMechId', id);
      set({ activeMechId: id });
  },

  buyPart: (part) => set((state) => {
      if (state.credits < part.cost) return state;
      const newCredits = state.credits - part.cost;
      const newOwned = new Set(state.ownedPartIds);
      newOwned.add(part.id);
      
      storage.saveGameState('credits', newCredits);
      storage.saveGameState('ownedParts', Array.from(newOwned));
      return { credits: newCredits, ownedPartIds: newOwned, systemLogs: [`Purchased ${part.name}`, ...state.systemLogs] };
  }),

  saveUserChip: (chip) => set((state) => {
      const newChips = [...state.userChips, chip];
      storage.saveGameState('userChips', newChips);
      return { userChips: newChips };
  }),

  deleteUserChip: (id) => set((state) => {
      const newChips = state.userChips.filter(c => c.id !== id);
      storage.saveGameState('userChips', newChips);
      return { userChips: newChips };
  }),

  markMailRead: (id) => set((state) => {
      const newMails = state.mails.map(m => m.id === id ? { ...m, read: true } : m);
      storage.markMailRead(id);
      return { mails: newMails };
  }),

  deleteMail: (id) => set((state) => {
      const newMails = state.mails.filter(m => m.id !== id);
      storage.deleteMail(id);
      return { mails: newMails };
  }),

  markAllRead: () => set((state) => {
      const ids = state.mails.filter(m => !m.read).map(m => m.id);
      const newMails = state.mails.map(m => ({ ...m, read: true }));
      storage.markMailsRead(ids);
      return { mails: newMails };
  }),

  deleteReadMails: () => set((state) => {
      const idsToDelete = state.mails.filter(m => m.read).map(m => m.id);
      if (idsToDelete.length === 0) return state;

      const newMails = state.mails.filter(m => !m.read);
      
      console.log(`[Store] Deleting ${idsToDelete.length} read mails.`);
      // Run storage async, but update state immediately
      storage.deleteMails(idsToDelete).catch(err => console.error("[Store] Failed to delete mails from DB", err));
      
      return { mails: newMails };
  }),

  setDebugSettings: (settings) => set((state) => ({ debugSettings: { ...state.debugSettings, ...settings } }))
}));
