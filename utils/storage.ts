
import { User, GameState, UserStats, Grade, Subject } from '../types';
import { StudyGuide } from '../services/gemini';
import { db, STORES } from '../services/db';

// --- SYNC HELPER ---
const syncToServer = async (username: string, storeName: string, data: any) => {
  try {
    await fetch(`/api/users/${username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [storeName]: data })
    });
  } catch (err) {
    console.error(`Sync failed for ${storeName}`, err);
  }
};

// --- AUTHENTICATION ---

export const auth = {
  register: async (username: string, password: string, displayName: string): Promise<boolean> => {
    const existingUser = await db.get<User & { password: string, createdAt: number }>(STORES.USERS, username);
    
    if (existingUser) {
      return false; // User exists
    }

    const newUser = { username, password, displayName, createdAt: Date.now() };
    await db.put(STORES.USERS, newUser);
    await syncToServer(username, STORES.USERS, newUser);
    
    // Initialize default data for new user
    await statsStorage.updateStats(username, { gamesPlayed: 0 });
    // Give 3 free AI Tickets to start
    await updateInventory(username, { coins: 200, items: { 'AI_TICKET': 3 } });
    
    return true;
  },

  login: async (username: string, password: string, remember: boolean = true): Promise<User | null> => {
    const storedUser = await db.get<User & { password: string }>(STORES.USERS, username);
    
    if (storedUser && storedUser.password === password) {
      // Sync from server on login
      try {
        const serverData = await fetch(`/api/users/${username}`).then(r => r.json());
        if (serverData) {
          if (serverData[STORES.STATS]) {
            await db.put(STORES.STATS, { username, ...serverData[STORES.STATS] });
          }
          if (serverData[STORES.INVENTORY]) {
            await db.put(STORES.INVENTORY, { username, ...serverData[STORES.INVENTORY] });
          }
        }
      } catch (e) { console.error("Server sync failed", e); }

      const user: User = {
        username: storedUser.username,
        displayName: storedUser.displayName
      };
      
      // Session handling (Keep lightweight session in LocalStorage for fast auth checks on init)
      const sessionData = JSON.stringify({ user, expires: remember ? 'NEVER' : 'SESSION' });
      if (remember) {
          localStorage.setItem('mazemind_session', sessionData);
      } else {
          sessionStorage.setItem('mazemind_session', sessionData);
      }
      
      return user;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem('mazemind_session');
    sessionStorage.removeItem('mazemind_session');
  },

  getCurrentUser: (): User | null => {
    // Sync check for UI rendering initialization
    const localSession = localStorage.getItem('mazemind_session');
    if (localSession) return JSON.parse(localSession).user;

    const sessionSession = sessionStorage.getItem('mazemind_session');
    if (sessionSession) return JSON.parse(sessionSession).user;

    return null;
  }
};

// --- GAME STATE ---

export const gameStorage = {
  saveGameState: async (username: string, state: GameState) => {
    if (state.screen === 'LOADING' || state.screen === 'AUTH' || state.screen === 'LANDING') {
      return;
    }
    // IndexedDB allows storing objects directly
    await db.put(STORES.GAME_STATES, { username, ...state });
  },

  loadGameState: async (username: string): Promise<GameState | null> => {
    const data = await db.get<GameState & { username: string }>(STORES.GAME_STATES, username);
    if (data) {
        // Remove username key before returning
        const { username: _, ...rest } = data;
        return rest as GameState;
    }
    return null;
  },

  clearGameState: async (username: string) => {
    await db.delete(STORES.GAME_STATES, username);
  }
};

// --- USER STATS ---

const getLocalDateString = (date: Date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

const INITIAL_MASTERY = [
  { subject: Subject.MATH_ALG, score: 15 },
  { subject: Subject.MATH_GEO, score: 25 },
  { subject: Subject.LIT, score: 35 },
  { subject: Subject.ENG, score: 45 },
  { subject: Subject.PHYS, score: 32 },
  { subject: Subject.CHEM, score: 18 },
  { subject: Subject.BIO, score: 20 }
];

export const statsStorage = {
  getStats: async (username: string): Promise<UserStats> => {
    const storedStats = await db.get<UserStats & { username: string }>(STORES.STATS, username);
    
    if (storedStats) {
      let currentStreak = storedStats.streak || 0;
      const lastCompleted = storedStats.lastCompletedDate;
      const todayStr = getLocalDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalDateString(yesterday);
      
      let needsResetSave = false;
      if (lastCompleted) {
        if (lastCompleted !== todayStr && lastCompleted !== yesterdayStr) {
          currentStreak = 0; // Streak broken
          needsResetSave = true;
        }
      } else {
        currentStreak = 0;
      }

      const returnedStats: UserStats = {
        gamesPlayed: storedStats.gamesPlayed || 0,
        questionsAnswered: storedStats.questionsAnswered || 0,
        totalScore: storedStats.totalScore || 0,
        highScore: storedStats.highScore || 0,
        streak: currentStreak,
        lastCompletedDate: storedStats.lastCompletedDate,
        mastery: (storedStats.mastery && storedStats.mastery.length > 0) ? storedStats.mastery : INITIAL_MASTERY,
        scoreHistory: storedStats.scoreHistory,
        thinkingErrors: storedStats.thinkingErrors || []
      };

      if (needsResetSave && storedStats.streak !== 0) {
        const resetStats = { ...storedStats, streak: 0 };
        await db.put(STORES.STATS, resetStats);
        await syncToServer(username, STORES.STATS, resetStats);
      }

      return returnedStats;
    }
    
    return {
      gamesPlayed: 0,
      questionsAnswered: 0,
      totalScore: 0,
      highScore: 0,
      streak: 0,
      mastery: INITIAL_MASTERY,
      scoreHistory: [],
      thinkingErrors: []
    };
  },

  updateStats: async (username: string, updates: Partial<UserStats>) => {
    const currentStats = await statsStorage.getStats(username);

    const todayStr = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    let history = currentStats.scoreHistory ? [...currentStats.scoreHistory] : [];
    
    const newTotalScore = currentStats.totalScore + (updates.totalScore || 0);

    const todayIndex = history.findIndex(h => h.date === todayStr);
    if (todayIndex >= 0) {
      history[todayIndex].score = newTotalScore;
    } else {
      history.push({ date: todayStr, score: newTotalScore });
    }

    if (history.length > 7) {
      history = history.slice(-7);
    }

    // Daily Streak Logic
    let currentStreak = currentStats.streak || 0;
    let lastCompleted = currentStats.lastCompletedDate;
    const todayISO = getLocalDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = getLocalDateString(yesterday);

    if (updates.nodeCompleted) {
      if (!lastCompleted) {
        currentStreak = 1;
        lastCompleted = todayISO;
      } else if (lastCompleted === yesterdayISO) {
        currentStreak += 1;
        lastCompleted = todayISO;
      } else if (lastCompleted === todayISO) {
        // already completed today, leave streak and date as is
      } else {
        currentStreak = 1;
        lastCompleted = todayISO;
      }
    } else {
      if (lastCompleted && lastCompleted !== todayISO && lastCompleted !== yesterdayISO) {
        currentStreak = 0;
      }
    }

    // Dynamic Mastery updates based on subject
    let masteryData = currentStats.mastery && currentStats.mastery.length > 0 
      ? [...currentStats.mastery] 
      : [...INITIAL_MASTERY];

    if (updates.subject) {
      const subjIndex = masteryData.findIndex(m => m.subject === updates.subject);
      if (subjIndex >= 0) {
        masteryData[subjIndex] = {
          ...masteryData[subjIndex],
          score: Math.min(100, masteryData[subjIndex].score + 8) // +8 points for solving correctly
        };
      } else {
        masteryData.push({ subject: updates.subject, score: 15 });
      }
    }

    const newStats = {
      username, // Key path
      gamesPlayed: currentStats.gamesPlayed + (updates.gamesPlayed || 0),
      questionsAnswered: currentStats.questionsAnswered + (updates.questionsAnswered || 0),
      totalScore: newTotalScore,
      highScore: Math.max(currentStats.highScore, updates.highScore || 0, newTotalScore),
      streak: currentStreak,
      lastCompletedDate: lastCompleted,
      mastery: masteryData,
      scoreHistory: history,
      thinkingErrors: currentStats.thinkingErrors || []
    };

    await db.put(STORES.STATS, newStats);
    await syncToServer(username, STORES.STATS, newStats);
    return newStats;
  },

  recordThinkingError: async (
    username: string, 
    errorType: string, 
    shortAnalysis: string, 
    suggestion: string,
    questionText: string,
    chosenOption: string,
    correctOption: string
  ) => {
    const currentStats = await statsStorage.getStats(username);
    const thinkingErrors = currentStats.thinkingErrors ? [...currentStats.thinkingErrors] : [];

    const existingIndex = thinkingErrors.findIndex(e => e.errorType === errorType);
    const newExample = {
      questionText,
      chosenOption,
      correctOption,
      analysis: shortAnalysis,
      timestamp: Date.now()
    };

    if (existingIndex >= 0) {
      const existing = thinkingErrors[existingIndex];
      thinkingErrors[existingIndex] = {
        ...existing,
        count: existing.count + 1,
        shortAnalysis,
        suggestion, // store last suggestion
        examples: [newExample, ...(existing.examples || [])].slice(0, 10) // keep up to 10 examples
      };
    } else {
      thinkingErrors.push({
        errorType,
        count: 1,
        shortAnalysis,
        suggestion,
        examples: [newExample]
      });
    }

    const newStats = {
      ...currentStats,
      username,
      thinkingErrors
    };

    await db.put(STORES.STATS, newStats);
    await syncToServer(username, STORES.STATS, newStats);
    return newStats;
  }
};

// --- INVENTORY ---

export interface Inventory {
  coins: number;
  items: Record<string, number>;
}

export const getInventory = async (username: string): Promise<Inventory> => {
  const inv = await db.get<Inventory & { username: string }>(STORES.INVENTORY, username);
  return inv || { coins: 100, items: {} };
};

export const updateInventory = async (username: string, inventory: Inventory) => {
  const fullInventory = { username, ...inventory };
  await db.put(STORES.INVENTORY, fullInventory);
  await syncToServer(username, STORES.INVENTORY, fullInventory);
};

// --- DOCUMENT CACHING (HEAVY DATA) ---

export const docStorage = {
  getDoc: async (grade: Grade, subject: Subject, semester: 1 | 2): Promise<StudyGuide | null> => {
    const key = `${grade}_${subject}_${semester}`;
    const doc = await db.get<StudyGuide & { id: string }>(STORES.DOCS, key);
    return doc || null;
  },

  saveDoc: async (grade: Grade, subject: Subject, semester: 1 | 2, data: StudyGuide) => {
    const key = `${grade}_${subject}_${semester}`;
    // Clone to avoid mutation
    const docToSave = JSON.parse(JSON.stringify(data));
    docToSave.id = key; // Key path
    await db.put(STORES.DOCS, docToSave);
  }
};

// --- BACKUP & RESTORE UTILS ---

export const exportData = async (username: string) => {
  const stats = await statsStorage.getStats(username);
  const inventory = await getInventory(username);
  const gameState = await gameStorage.loadGameState(username);
  
  const data = {
    version: 1,
    timestamp: Date.now(),
    username,
    stats,
    inventory,
    gameState
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `mazemind_backup_${username}_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importData = async (username: string, file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        
        if (data.version !== 1) throw new Error("Invalid version");
        
        // Restore data
        if (data.stats) await statsStorage.updateStats(username, data.stats); // This logic might need slight tweak as updateStats adds to existing. 
        // For restore, we might want to overwrite.
        await db.put(STORES.STATS, { username, ...data.stats });

        if (data.inventory) await updateInventory(username, data.inventory);
        if (data.gameState) await gameStorage.saveGameState(username, data.gameState);
        
        resolve(true);
      } catch (err) {
        console.error("Import failed", err);
        resolve(false);
      }
    };
    reader.readAsText(file);
  });
};
