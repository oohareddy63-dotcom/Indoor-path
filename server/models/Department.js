const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    id:       { type: String, required: true, unique: true, trim: true },
    name:     { type: String, required: true, trim: true },
    floor:    { type: Number, required: true, min: 0, max: 10 },
    room:     { type: String, required: true, trim: true },
    category: { type: String, required: true, default: "Specialty Care" },
    color:    { type: String, required: true, default: "#1769FF" },
    nodeId:   { type: String, required: true, default: "reception" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", departmentSchema);
