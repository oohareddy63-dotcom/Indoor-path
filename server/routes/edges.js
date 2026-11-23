const router = require("express").Router();
const Edge = require("../models/Edge");

// Runtime-only blocked set — resets on restart (matches the demo admin UX)
const blockedEdges = new Set();

// GET all edges
router.get("/", async (_req, res) => {
  try {
    const docs = await Edge.find().sort({ id: 1 }).lean();
    res.json(
      docs.map(({ _id, __v, createdAt, updatedAt, ...e }) => ({
        ...e,
        blocked: blockedEdges.has(e.id),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT block / unblock an edge
router.put("/:id/block", async (req, res) => {
  try {
    const doc = await Edge.findOne({ id: req.params.id }).lean();
    if (!doc) return res.status(404).json({ error: "Edge not found." });
    const { blocked } = req.body;
    blocked ? blockedEdges.add(req.params.id) : blockedEdges.delete(req.params.id);
    res.json({ id: req.params.id, blocked: blockedEdges.has(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
