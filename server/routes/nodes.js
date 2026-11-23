const router = require("express").Router();
const Node = require("../models/Node");

// GET all nodes
router.get("/", async (_req, res) => {
  try {
    const docs = await Node.find().sort({ floor: 1, id: 1 }).lean();
    res.json(docs.map(({ _id, __v, createdAt, updatedAt, ...n }) => n));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
