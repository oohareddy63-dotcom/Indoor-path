/**
 * index.js — MediPath 3D Navigation
 * MERN Stack: MongoDB Atlas + Express + Node.js
 *
 * REST API:
 *   GET    /api/health
 *   GET    /api/departments
 *   POST   /api/departments
 *   PUT    /api/departments/:id
 *   DELETE /api/departments/:id
 *   GET    /api/nodes
 *   GET    /api/edges
 *   PUT    /api/edges/:id/block
 *   GET    /api/qr-locations
 */

require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const mongoose   = require("mongoose");
const seedIfEmpty = require("./seed");

// ─── Routes ───────────────────────────────────────────────────────────────────

const departmentsRouter  = require("./routes/departments");
const nodesRouter        = require("./routes/nodes");
const edgesRouter        = require("./routes/edges");
const qrLocationsRouter  = require("./routes/qrLocations");

// ─── App ──────────────────────────────────────────────────────────────────────

const app  = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Health — also shows DB connection state
app.get("/api/health", (_req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status:    "ok",
    db:        states[mongoose.connection.readyState] ?? "unknown",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/departments",  departmentsRouter);
app.use("/api/nodes",        nodesRouter);
app.use("/api/edges",        edgesRouter);
app.use("/api/qr-locations", qrLocationsRouter);

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: "Route not found." }));

// ─── Connect to MongoDB then start server ─────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is missing from .env");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
  .then(async () => {
    console.log("✅  Connected to MongoDB Atlas");
    await seedIfEmpty();
    app.listen(PORT, () => {
      console.log(`\n🏥  MediPath API    →  http://localhost:${PORT}`);
      console.log(`    Health check   →  http://localhost:${PORT}/api/health`);
      console.log(`    Departments    →  http://localhost:${PORT}/api/departments`);
      console.log(`    Nodes          →  http://localhost:${PORT}/api/nodes`);
      console.log(`    Edges          →  http://localhost:${PORT}/api/edges`);
      console.log(`    QR locations   →  http://localhost:${PORT}/api/qr-locations\n`);
    });
  })
  .catch((err) => {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  });
