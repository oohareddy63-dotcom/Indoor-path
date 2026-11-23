const router = require("express").Router();
const Department = require("../models/Department");

// GET all departments
router.get("/", async (_req, res) => {
  try {
    const docs = await Department.find().sort({ floor: 1, name: 1 }).lean();
    res.json(docs.map(clean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create department
router.post("/", async (req, res) => {
  const { id, name, floor, room, category, color, nodeId, node_id } = req.body;
  if (!id || !name || !room)
    return res.status(400).json({ error: "id, name, and room are required." });
  try {
    const doc = await Department.create({
      id, name,
      floor:    Number(floor ?? 0),
      room,
      category: category ?? "Specialty Care",
      color:    color    ?? "#1769FF",
      nodeId:   nodeId   ?? node_id ?? "reception",
    });
    res.status(201).json(clean(doc.toObject()));
  } catch (err) {
    const status = err.code === 11000 ? 409 : 500;
    res.status(status).json({ error: err.message });
  }
});

// PUT update department
router.put("/:id", async (req, res) => {
  try {
    const { name, floor, room, category, color } = req.body;
    const update = {};
    if (name     != null) update.name     = name;
    if (floor    != null) update.floor    = Number(floor);
    if (room     != null) update.room     = room;
    if (category != null) update.category = category;
    if (color    != null) update.color    = color;
    const doc = await Department.findOneAndUpdate(
      { id: req.params.id }, update, { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: "Department not found." });
    res.json(clean(doc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE department
router.delete("/:id", async (req, res) => {
  try {
    const doc = await Department.findOneAndDelete({ id: req.params.id });
    if (!doc) return res.status(404).json({ error: "Department not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function clean({ _id, __v, createdAt, updatedAt, ...rest }) {
  return rest;
}

module.exports = router;
