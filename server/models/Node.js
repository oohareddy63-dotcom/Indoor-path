const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema(
  {
    id:    { type: String, required: true, unique: true },
    label: { type: String, required: true },
    floor: { type: Number, required: true },
    x:     { type: Number, required: true },
    y:     { type: Number, required: true },
    kind:  {
      type: String,
      required: true,
      enum: ["location", "corridor", "lift", "stairs", "department"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Node", nodeSchema);
