const mongoose = require("mongoose");

const edgeSchema = new mongoose.Schema(
  {
    id:         { type: String, required: true, unique: true },
    from:       { type: String, required: true },
    to:         { type: String, required: true },
    distance:   { type: Number, required: true },
    type:       { type: String, required: true, enum: ["walk", "lift", "stairs", "ramp"] },
    accessible: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Edge", edgeSchema);
