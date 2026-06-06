import { CryptoService } from '../utils/crypto';

const DB_NAME = '24hocDB';
const DB_VERSION = 1;

// Define Store Names
export const STORES = {
  USERS: 'users',
  STATS: 'stats',
  GAME_STATES: 'game_states',
  INVENTORY: 'inventory',
  DOCS: 'docs'
};

// SENSITIVE STORES that need encryption
const SENSITIVE_STORES = [STORES.USERS, STORES.GAME_STATES];

// Memory Optimization: Use WeakMap to cache DB instances if needed, 
// though here we only have one DB, let's use a simple singleton with a promise.
let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create Stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.USERS)) {
        db.createObjectStore(STORES.USERS, { keyPath: 'username' });
      }
      if (!db.objectStoreNames.contains(STORES.STATS)) {
        db.createObjectStore(STORES.STATS, { keyPath: 'username' });
      }
      if (!db.objectStoreNames.contains(STORES.GAME_STATES)) {
        db.createObjectStore(STORES.GAME_STATES, { keyPath: 'username' });
      }
      if (!db.objectStoreNames.contains(STORES.INVENTORY)) {
        db.createObjectStore(STORES.INVENTORY, { keyPath: 'username' });
      }
      if (!db.objectStoreNames.contains(STORES.DOCS)) {
        db.createObjectStore(STORES.DOCS, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
};

// Generic Helper Methods
export const db = {
  get: async <T>(storeName: string, key: string): Promise<T | undefined> => {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        let result = request.result;
        if (result && SENSITIVE_STORES.includes(storeName)) {
          // Decrypt sensitive data
          const decrypted = CryptoService.decrypt(result.payload);
          resolve(decrypted);
        } else {
          resolve(result);
        }
      };
      request.onerror = () => reject(request.error);
    });
  },

  put: async <T>(storeName: string, value: T): Promise<void> => {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      let dataToStore: any = value;
      if (SENSITIVE_STORES.includes(storeName)) {
        // Encrypt sensitive data
        // We need to keep the keyPath (username or id) outside the encrypted payload
        const keyPath = store.keyPath as string;
        const key = (value as any)[keyPath];
        dataToStore = {
          [keyPath]: key,
          payload: CryptoService.encrypt(value)
        };
      }

      const request = store.put(dataToStore);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  delete: async (storeName: string, key: string): Promise<void> => {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  getAll: async <T>(storeName: string): Promise<T[]> => {
     const database = await openDB();
     return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
     });
  },
  
  clearStore: async (storeName: string): Promise<void> => {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    })
  }
};