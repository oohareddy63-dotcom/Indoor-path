/**
 * app.js — Express app for both local dev and Vercel serverless.
 *
 * Vercel points  /api/*  at this file as a serverless function.
 * index.js (local) imports this and calls app.listen().
 *
 * Key serverless requirement:
 *   - Never call app.listen() here — Vercel handles that.
 *   - Cache the Mongoose connection across warm invocations.
 *   - Export the app as module.exports so Vercel can wrap it.
 */

require("dotenv").config();

const express     = require("express");
const cors        = require("cors");
const mongoose    = require("mongoose");
const seedIfEmpty = require("./seed");

// ─── Cached DB connection (survives lambda warm re-use) ───────────────────────

let dbReady = false;

async function ensureDB() {
  if (dbReady && mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set.");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  await seedIfEmpty();
  dbReady = true;
}

// ─── Express app ──────────────────────────────────────────────────────────────

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? "*" }));
app.use(express.json());

// Connect DB before every request (no-op on warm invocations)
app.use(async (_req, res, next) => {
  try {
    await ensureDB();
    next();
  } catch (err) {
    res.status(500).json({ error: "DB connection failed.", detail: err.message });
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status:    "ok",
    db:        states[mongoose.connection.readyState] ?? "unknown",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/departments",  require("./routes/departments"));
app.use("/api/nodes",        require("./routes/nodes"));
app.use("/api/edges",        require("./routes/edges"));
app.use("/api/qr-locations", require("./routes/qrLocations"));

app.use((_req, res) => res.status(404).json({ error: "Route not found." }));

// ─── Export for Vercel (do NOT call app.listen here) ─────────────────────────

module.exports = app;
