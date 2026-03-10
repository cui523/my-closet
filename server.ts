import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("wardrobe.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS clothes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image TEXT NOT NULL,
    originalImage TEXT,
    seasons TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );
`);

// Seed default categories if empty
const categoryCount = db.prepare("SELECT count(*) as count FROM categories").get() as { count: number };
if (categoryCount.count === 0) {
  const insert = db.prepare("INSERT INTO categories (name) VALUES (?)");
  ["卫衣", "裤子", "裙子", "风衣", "短毛衣", "长毛衣", "羽绒服", "T恤", "衬衫"].forEach(cat => {
    insert.run(cat);
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Serve static manifest
  app.get("/manifest.json", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "manifest.json"));
  });

  // API Routes
  app.get("/api/clothes", (req, res) => {
    const clothes = db.prepare("SELECT * FROM clothes ORDER BY createdAt DESC").all();
    res.json(clothes.map((item: any) => ({
      ...item,
      seasons: JSON.parse(item.seasons)
    })));
  });

  app.post("/api/clothes", (req, res) => {
    const { image, originalImage, seasons, category, location } = req.body;
    const info = db.prepare(
      "INSERT INTO clothes (image, originalImage, seasons, category, location) VALUES (?, ?, ?, ?, ?)"
    ).run(image, originalImage, JSON.stringify(seasons), category, location);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/clothes/:id", (req, res) => {
    db.prepare("DELETE FROM clothes WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.post("/api/categories", (req, res) => {
    try {
      const { name } = req.body;
      db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Category already exists" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
