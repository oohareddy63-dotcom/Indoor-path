/**
 * index.js — Local development entry point.
 * Imports the shared Express app and starts a real HTTP server.
 * Vercel uses app.js directly (via vercel.json) and never calls this file.
 */

require("dotenv").config();

const mongoose    = require("mongoose");
const app         = require("./app");
const seedIfEmpty = require("./seed");

const PORT        = process.env.API_PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is missing from server/.env");
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
