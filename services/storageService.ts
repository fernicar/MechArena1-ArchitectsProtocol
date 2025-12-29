
import { MechBuild, PlayerProfile, Mail, MechPart, AIChip, Rival } from '../types';
import { STARTER_BUILD, INITIAL_CREDITS, ENEMIES } from '../constants';

const DB_NAME = 'CoreArchitectDB';
const DB_VERSION = 1;

interface GameData {
  credits: number;
  profile: PlayerProfile;
  mechs: Record<string, MechBuild>;
  activeMechId: string | null;
  ownedPartIds: string[];
  mails: Mail[];
  userChips: AIChip[];
  rivals: Rival[];
}

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Store for simple key-value pairs (credits, profile, etc.)
      if (!db.objectStoreNames.contains('gameState')) {
        db.createObjectStore('gameState', { keyPath: 'key' });
      }

      // Store for Mails (can get very large due to replays)
      if (!db.objectStoreNames.contains('mails')) {
        db.createObjectStore('mails', { keyPath: 'id' });
      }
    };
  });
};

const getDB = async (): Promise<IDBDatabase> => {
    return await initDB();
}

export const saveGameState = async (key: string, value: any) => {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['gameState'], 'readwrite');
        const store = transaction.objectStore('gameState');
        const request = store.put({ key, value });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const loadGameState = async <T>(key: string, fallback: T): Promise<T> => {
    const db = await getDB();
    return new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(['gameState'], 'readonly');
        const store = transaction.objectStore('gameState');
        const request = store.get(key);

        request.onsuccess = () => {
            resolve(request.result ? request.result.value : fallback);
        };
        request.onerror = () => {
            console.error(`Error loading ${key}`, request.error);
            resolve(fallback);
        };
    });
};

export const saveMail = async (mail: Mail) => {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['mails'], 'readwrite');
        const store = transaction.objectStore('mails');
        const request = store.put(mail);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteMail = async (id: string) => {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['mails'], 'readwrite');
        const store = transaction.objectStore('mails');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export const deleteMails = async (ids: string[]) => {
    if (ids.length === 0) return;
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['mails'], 'readwrite');
        const store = transaction.objectStore('mails');
        
        let deletedCount = 0;
        ids.forEach(id => {
            store.delete(id);
            deletedCount++;
        });

        transaction.oncomplete = () => {
            console.log(`[Storage] Successfully deleted ${deletedCount} mails.`);
            resolve();
        };
        transaction.onerror = (event) => {
            console.error("[Storage] Bulk delete failed", transaction.error);
            reject(transaction.error);
        };
    });
};

export const markMailRead = async (id: string) => {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['mails'], 'readwrite');
        const store = transaction.objectStore('mails');
        const getReq = store.get(id);

        getReq.onsuccess = () => {
            const mail = getReq.result as Mail;
            if (mail) {
                mail.read = true;
                store.put(mail);
                resolve();
            } else {
                resolve(); // Mail not found, consider it handled
            }
        };
        getReq.onerror = () => reject(getReq.error);
    });
}

export const markMailsRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['mails'], 'readwrite');
        const store = transaction.objectStore('mails');
        
        ids.forEach(id => {
            const getReq = store.get(id);
            getReq.onsuccess = () => {
                const mail = getReq.result as Mail;
                if (mail) {
                    mail.read = true;
                    store.put(mail);
                }
            };
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const loadAllMails = async (): Promise<Mail[]> => {
    const db = await getDB();
    return new Promise<Mail[]>((resolve, reject) => {
        const transaction = db.transaction(['mails'], 'readonly');
        const store = transaction.objectStore('mails');
        const request = store.getAll();

        request.onsuccess = () => {
            // Sort by timestamp desc (newest first)
            const mails = request.result as Mail[];
            resolve(mails.reverse()); 
        };
        request.onerror = () => reject(request.error);
    });
};

export const clearAllData = async () => {
    return new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error("Database blocked"));
    });
};

// Initial Data with Glicko Stats
const INITIAL_PROFILE: PlayerProfile = {
  name: 'ARCHITECT-01',
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
};

const INITIAL_MAILS: Mail[] = [
  {
    id: 'm_init_01',
    sender: 'SYSTEM',
    subject: 'Welcome to the Protocol',
    preview: 'Registration complete. Unit authorization granted...',
    body: `# ARCHITECT REGISTRATION CONFIRMED\n\nWelcome to the Nexus. Your initial unit **"ROOKIE-01"** has been delivered to the Hangar.\n\n* Access the **Garage** to customize your frame.\n* Visit the **AI Lab** to tune behavior parameters.\n\nThe Tournament Arena is open for E-Rank participants.\n\nGood luck.\n\n*- System Admin*`,
    timestamp: new Date().toISOString(),
    read: false,
    type: 'SYSTEM'
  }
];

export const loadFullGameData = async (): Promise<GameData> => {
    try {
        const [credits, profile, legacyMech, mechs, activeMechId, ownedPartIds, mails, userChips, rivals] = await Promise.all([
            loadGameState<number>('credits', INITIAL_CREDITS),
            loadGameState<PlayerProfile>('profile', INITIAL_PROFILE),
            loadGameState<MechBuild | null>('myMech', null), // Legacy check
            loadGameState<Record<string, MechBuild>>('mechs', {}),
            loadGameState<string | null>('activeMechId', null),
            loadGameState<string[]>('ownedParts', Object.values(STARTER_BUILD.parts).map(p => p.id)),
            loadAllMails(),
            loadGameState<AIChip[]>('userChips', []),
            loadGameState<Rival[]>('rivals', [])
        ]);

        let finalMechs = mechs;
        let finalActiveId = activeMechId;

        // Migration: If legacy mech exists but no roster
        if (legacyMech && Object.keys(mechs).length === 0) {
            finalMechs = { [legacyMech.id || 'mech_legacy']: { ...legacyMech, id: legacyMech.id || 'mech_legacy' } };
            finalActiveId = legacyMech.id || 'mech_legacy';
        }
        
        // Init: If completely empty
        if (Object.keys(finalMechs).length === 0) {
            finalMechs = { [STARTER_BUILD.id]: STARTER_BUILD };
            finalActiveId = STARTER_BUILD.id;
        }

        // If it's the very first load, mails might be empty. Seed it.
        let finalMails = mails;
        if (mails.length === 0) {
            await saveMail(INITIAL_MAILS[0]);
            finalMails = INITIAL_MAILS;
        }

        // CRITICAL FIX: Ensure active ID points to a real mech
        if (!finalActiveId || !finalMechs[finalActiveId]) {
            console.warn("[Storage] Active Mech ID invalid or missing. Resetting to first available mech.");
            const keys = Object.keys(finalMechs);
            if (keys.length > 0) {
                finalActiveId = keys[0];
            } else {
                // Fallback if somehow mechs is empty after init
                finalMechs = { [STARTER_BUILD.id]: STARTER_BUILD };
                finalActiveId = STARTER_BUILD.id;
            }
        }

        return {
            credits,
            profile,
            mechs: finalMechs,
            activeMechId: finalActiveId,
            ownedPartIds,
            mails: finalMails,
            userChips,
            rivals
        };
    } catch (e) {
        console.error("Critical Storage Error", e);
        // Fallback to avoid crash
        return {
            credits: INITIAL_CREDITS,
            profile: INITIAL_PROFILE,
            mechs: { [STARTER_BUILD.id]: STARTER_BUILD },
            activeMechId: STARTER_BUILD.id,
            ownedPartIds: Object.values(STARTER_BUILD.parts).map(p => p.id),
            mails: INITIAL_MAILS,
            userChips: [],
            rivals: []
        };
    }
};
