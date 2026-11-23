const mongoose = require("mongoose");

const qrLocationSchema = new mongoose.Schema(
  {
    code:   { type: String, required: true, unique: true },
    nodeId: { type: String, required: true },
    label:  { type: String, required: true },
    floor:  { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QrLocation", qrLocationSchema);
