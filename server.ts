import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(process.cwd(), "db.json");
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Use a more robust key derivation or a fixed key for the demo
// In a real app, this should come from environment variables
const SERVER_SECRET = process.env.SERVER_SECRET || "24hoc-secure-system-secret-2024";
const ENCRYPTION_KEY = crypto.scryptSync(SERVER_SECRET, "salt-constant", 32);
const IV_LENGTH = 16;

function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch (error) {
    console.error("Encryption error:", error);
    return text; // Fallback to plain text if encryption fails (for debugging/safety during dev)
  }
}

function decrypt(text: string): string {
  try {
    if (!text.includes(":")) return text; // Assume plain text if no delimiter
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error("Decryption error:", error);
    return text; // Fallback to original text if decryption fails
  }
}

// ... (Trie and LRUCache classes remain same)
class TrieNode {
  children = new Map<string, TrieNode>();
  isEndOfWord = false;
  lessonIds: string[] = [];
}

class Trie {
  root = new TrieNode();

  insert(word: string, lessonId: string) {
    let node = this.root;
    const cleanWord = word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const char of cleanWord) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
      if (!node.lessonIds.includes(lessonId)) {
        node.lessonIds.push(lessonId);
      }
    }
    node.isEndOfWord = true;
  }

  search(prefix: string): string[] {
    let node = this.root;
    const cleanPrefix = prefix.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const char of cleanPrefix) {
      if (!node.children.has(char)) return [];
      node = node.children.get(char)!;
    }
    return node.lessonIds;
  }
}

class LRUCache<T> {
  private capacity: number;
  private cache = new Map<string, T>();

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (item) {
      this.cache.delete(key);
      this.cache.set(key, item);
      return item;
    }
    return undefined;
  }

  put(key: string, value: T) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

// --- DATABASE SERVICE ---
interface DatabaseSchema {
  users: Record<string, any>;
  lessons: Record<string, any>;
  stats: Record<string, any>;
  activities: any[];
}

class Database {
  private data: DatabaseSchema = { users: {}, lessons: {}, stats: {}, activities: [] };
  private trie = new Trie();
  private lessonCache = new LRUCache<any>(100);
  private writeQueue: Promise<void> = Promise.resolve();

  async init() {
    try {
      const exists = await fs.access(DB_FILE).then(() => true).catch(() => false);
      if (!exists) {
        console.log("DB file not found, creating new one.");
        await this.save();
        return;
      }

      const content = await fs.readFile(DB_FILE, "utf-8");
      if (!content.trim()) {
        await this.save();
        return;
      }

      const decrypted = decrypt(content);
      try {
        this.data = JSON.parse(decrypted);
      } catch (e) {
        console.warn("Could not parse decrypted content, trying plain content.");
        this.data = JSON.parse(content);
      }

      // Ensure structure
      this.data.users = this.data.users || {};
      this.data.lessons = this.data.lessons || {};
      this.data.stats = this.data.stats || {};
      this.data.activities = this.data.activities || [];

      // Build Trie for existing lessons
      Object.keys(this.data.lessons).forEach(id => {
        const lesson = this.data.lessons[id];
        if (lesson && lesson.title) {
          this.trie.insert(lesson.title, id);
        }
      });
      console.log("Database initialized successfully.");
    } catch (e) {
      console.error("Database initialization failed:", e);
      await this.save();
    }
  }

  async save(): Promise<void> {
    // Chain save operations sequentially using the writeQueue Promise to process writes one-by-one
    this.writeQueue = this.writeQueue.then(async () => {
      try {
        const json = JSON.stringify(this.data, null, 2);
        const encrypted = encrypt(json);
        const tmpFile = `${DB_FILE}.tmp`;
        
        // Write to temporary buffer file first, avoiding half-written outputs during shutdowns/restarts
        await fs.writeFile(tmpFile, encrypted, "utf-8");
        // Rename atomically to core file
        await fs.rename(tmpFile, DB_FILE);
      } catch (error) {
        console.error("Atomic database writing failed in sequential queue:", error);
      }
    });

    return this.writeQueue;
  }

  getUser(username: string) {
    return this.data.users[username];
  }

  async saveUser(username: string, userData: any) {
    const oldScore = this.data.stats[username]?.totalScore || 0;
    // Merge instead of overwrite to keep users, stats, and inventory records alive
    this.data.users[username] = {
      ...(this.data.users[username] || {}),
      ...userData
    };

    const mergedUser = this.data.users[username];

    // Track globally for leaderboard using merged profile stats
    if (mergedUser.stats) {
      const newScore = mergedUser.stats.totalScore || 0;
      const displayName = mergedUser.users?.displayName || mergedUser.displayName || username;
      this.data.stats[username] = {
        displayName,
        totalScore: newScore,
        highScore: mergedUser.stats.highScore || 0,
        lastActive: Date.now()
      };

      // Add to activity feed if significant progress
      if (newScore > oldScore) {
         this.data.activities.unshift({
           username,
           displayName,
           type: 'SCORE_UP',
           value: newScore - oldScore,
           timestamp: Date.now()
         });
         this.data.activities = this.data.activities.slice(0, 50);
      }
    }
    await this.save();
  }

  getLesson(id: string) {
    return this.lessonCache.get(id) || this.data.lessons[id];
  }

  async saveLesson(id: string, lessonData: any) {
    this.data.lessons[id] = lessonData;
    this.lessonCache.put(id, lessonData);
    if (lessonData.title) {
      this.trie.insert(lessonData.title, id);
    }
    await this.save();
  }

  searchLessons(query: string) {
    const ids = this.trie.search(query);
    return ids.map(id => this.data.lessons[id]).filter(Boolean);
  }

  getLeaderboard() {
    return Object.values(this.data.stats)
      .sort((a: any, b: any) => b.totalScore - a.totalScore)
      .slice(0, 10);
  }

  getRecentActivities() {
    return this.data.activities;
  }
}

const db = new Database();

async function startServer() {
  await db.init();
  const app = express();
  app.use(express.json());

  // --- API ROUTES ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Lesson Search with Trie
  app.get("/api/lessons/search", (req, res) => {
    const { q } = req.query;
    if (typeof q !== "string") return res.status(400).json({ error: "Invalid query" });
    const results = db.searchLessons(q);
    res.json(results);
  });

  // Get/Save Lesson with LRU Cache
  app.get("/api/lessons/:id", (req, res) => {
    const lesson = db.getLesson(req.params.id);
    if (!lesson) return res.status(404).json({ error: "Not found" });
    res.json(lesson);
  });

  app.post("/api/lessons", async (req, res) => {
    const { id, data } = req.body;
    await db.saveLesson(id, data);
    res.json({ success: true });
  });

  // User Data Sync
  app.get("/api/users/:username", (req, res) => {
    const user = db.getUser(req.params.username);
    res.json(user || null);
  });

  app.post("/api/users/:username", async (req, res) => {
    await db.saveUser(req.params.username, req.body);
    res.json({ success: true });
  });

  // Leaderboard
  app.get("/api/leaderboard", (req, res) => {
    res.json(db.getLeaderboard());
  });

  // Activities
  app.get("/api/activities", (req, res) => {
    res.json(db.getRecentActivities());
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Serve the Vite dist folder as static files
    app.use(express.static(distPath, {
      maxAge: '1d',
      etag: false
    }));
    // Fallback to index.html for SPA routing
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error("Error serving index.html:", err);
          res.status(404).send("Not found");
        }
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
