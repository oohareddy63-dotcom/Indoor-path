const router = require("express").Router();
const QrLocation = require("../models/QrLocation");

// GET all QR locations
router.get("/", async (_req, res) => {
  try {
    const docs = await QrLocation.find().sort({ floor: 1, label: 1 }).lean();
    res.json(docs.map(({ _id, __v, createdAt, updatedAt, ...q }) => q));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
