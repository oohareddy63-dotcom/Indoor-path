/**
 * seed.js — populates MongoDB with the hospital graph data on first run.
 * Called once after the DB connection is established.
 */

const Department = require("./models/Department");
const Node       = require("./models/Node");
const Edge       = require("./models/Edge");
const QrLocation = require("./models/QrLocation");

async function seedIfEmpty() {
  const count = await Department.countDocuments();
  if (count > 0) {
    console.log("ℹ️  Database already seeded — skipping.");
    return;
  }

  console.log("🌱 Seeding hospital data into MongoDB...");

  await Department.insertMany([
    { id: "emergency",   name: "Emergency",    floor: 0, room: "101", category: "Urgent Care",      color: "#F43F5E", nodeId: "emergency"   },
    { id: "pharmacy",    name: "Pharmacy",     floor: 0, room: "105", category: "Patient Services",  color: "#00B8A9", nodeId: "pharmacy"    },
    { id: "laboratory",  name: "Laboratory",   floor: 0, room: "110", category: "Diagnostics",       color: "#8B5CF6", nodeId: "laboratory"  },
    { id: "orthopedics", name: "Orthopedics",  floor: 1, room: "115", category: "Specialty Care",    color: "#F59E0B", nodeId: "orthopedics" },
    { id: "radiology",   name: "Radiology",    floor: 1, room: "120", category: "Diagnostics",       color: "#1769FF", nodeId: "radiology"   },
    { id: "cardiology",  name: "Cardiology",   floor: 2, room: "205", category: "Specialty Care",    color: "#F43F5E", nodeId: "cardiology"  },
    { id: "neurology",   name: "Neurology",    floor: 2, room: "210", category: "Specialty Care",    color: "#14B8A6", nodeId: "neurology"   },
  ]);
  console.log("  ✅ Departments");

  await Node.insertMany([
    { id: "entrance",    label: "Main Entrance",             floor: 0, x: 48, y: 88, kind: "location"   },
    { id: "reception",   label: "Reception",                 floor: 0, x: 48, y: 68, kind: "location"   },
    { id: "g_corridor",  label: "Ground Floor Corridor",     floor: 0, x: 48, y: 48, kind: "corridor"   },
    { id: "g_lift_e",    label: "East Lift",                 floor: 0, x: 72, y: 48, kind: "lift"       },
    { id: "g_lift_w",    label: "West Lift",                 floor: 0, x: 24, y: 48, kind: "lift"       },
    { id: "g_stairs",    label: "Ground Floor Stairs",       floor: 0, x: 48, y: 25, kind: "stairs"     },
    { id: "emergency",   label: "Emergency",                 floor: 0, x: 12, y: 70, kind: "department" },
    { id: "pharmacy",    label: "Pharmacy",                  floor: 0, x: 83, y: 72, kind: "department" },
    { id: "laboratory",  label: "Laboratory",                floor: 0, x: 82, y: 25, kind: "department" },
    { id: "f1_corridor", label: "First Floor Corridor",      floor: 1, x: 48, y: 48, kind: "corridor"   },
    { id: "f1_lift_e",   label: "East Lift · Floor 1",       floor: 1, x: 72, y: 48, kind: "lift"       },
    { id: "f1_lift_w",   label: "West Lift · Floor 1",       floor: 1, x: 24, y: 48, kind: "lift"       },
    { id: "f1_stairs",   label: "Stairs · Floor 1",          floor: 1, x: 48, y: 25, kind: "stairs"     },
    { id: "orthopedics", label: "Orthopedics",               floor: 1, x: 15, y: 72, kind: "department" },
    { id: "radiology",   label: "Radiology",                 floor: 1, x: 83, y: 72, kind: "department" },
    { id: "f2_corridor", label: "Second Floor Corridor",     floor: 2, x: 48, y: 48, kind: "corridor"   },
    { id: "f2_lift_e",   label: "East Lift · Floor 2",       floor: 2, x: 72, y: 48, kind: "lift"       },
    { id: "f2_lift_w",   label: "West Lift · Floor 2",       floor: 2, x: 24, y: 48, kind: "lift"       },
    { id: "f2_stairs",   label: "Stairs · Floor 2",          floor: 2, x: 48, y: 25, kind: "stairs"     },
    { id: "cardiology",  label: "Cardiology",                floor: 2, x: 82, y: 72, kind: "department" },
    { id: "neurology",   label: "Neurology",                 floor: 2, x: 14, y: 72, kind: "department" },
  ]);
  console.log("  ✅ Nodes (hospital graph)");

  await Edge.insertMany([
    { id: "entrance-reception", from: "entrance",    to: "reception",    distance: 18, type: "ramp",   accessible: true  },
    { id: "reception-g",        from: "reception",   to: "g_corridor",   distance: 16, type: "walk",   accessible: true  },
    { id: "g-east",             from: "g_corridor",  to: "g_lift_e",     distance: 20, type: "walk",   accessible: true  },
    { id: "g-west",             from: "g_corridor",  to: "g_lift_w",     distance: 24, type: "walk",   accessible: true  },
    { id: "g-stairs",           from: "g_corridor",  to: "g_stairs",     distance: 15, type: "walk",   accessible: true  },
    { id: "g-emergency",        from: "g_corridor",  to: "emergency",    distance: 34, type: "walk",   accessible: true  },
    { id: "g-pharmacy",         from: "g_corridor",  to: "pharmacy",     distance: 28, type: "walk",   accessible: true  },
    { id: "g-lab",              from: "g_corridor",  to: "laboratory",   distance: 32, type: "walk",   accessible: true  },
    { id: "east-01",            from: "g_lift_e",    to: "f1_lift_e",    distance: 14, type: "lift",   accessible: true  },
    { id: "east-12",            from: "f1_lift_e",   to: "f2_lift_e",    distance: 14, type: "lift",   accessible: true  },
    { id: "west-01",            from: "g_lift_w",    to: "f1_lift_w",    distance: 17, type: "lift",   accessible: true  },
    { id: "west-12",            from: "f1_lift_w",   to: "f2_lift_w",    distance: 17, type: "lift",   accessible: true  },
    { id: "stairs-01",          from: "g_stairs",    to: "f1_stairs",    distance: 10, type: "stairs", accessible: false },
    { id: "stairs-12",          from: "f1_stairs",   to: "f2_stairs",    distance: 10, type: "stairs", accessible: false },
    { id: "f1-east",            from: "f1_lift_e",   to: "f1_corridor",  distance: 20, type: "walk",   accessible: true  },
    { id: "f1-west",            from: "f1_lift_w",   to: "f1_corridor",  distance: 24, type: "walk",   accessible: true  },
    { id: "f1-stairs",          from: "f1_stairs",   to: "f1_corridor",  distance: 15, type: "walk",   accessible: true  },
    { id: "f1-ortho",           from: "f1_corridor", to: "orthopedics",  distance: 30, type: "walk",   accessible: true  },
    { id: "f1-radio",           from: "f1_corridor", to: "radiology",    distance: 28, type: "walk",   accessible: true  },
    { id: "f2-east",            from: "f2_lift_e",   to: "f2_corridor",  distance: 20, type: "walk",   accessible: true  },
    { id: "f2-west",            from: "f2_lift_w",   to: "f2_corridor",  distance: 24, type: "walk",   accessible: true  },
    { id: "f2-stairs",          from: "f2_stairs",   to: "f2_corridor",  distance: 15, type: "walk",   accessible: true  },
    { id: "f2-cardio",          from: "f2_corridor", to: "cardiology",   distance: 29, type: "walk",   accessible: true  },
    { id: "f2-neuro",           from: "f2_corridor", to: "neurology",    distance: 31, type: "walk",   accessible: true  },
  ]);
  console.log("  ✅ Edges (corridors, lifts, stairs)");

  await QrLocation.insertMany([
    { code: "MP3D-ENTRANCE",   nodeId: "entrance",   label: "Main Entrance",          floor: 0 },
    { code: "MP3D-RECEPTION",  nodeId: "reception",  label: "Reception",              floor: 0 },
    { code: "MP3D-G-CORRIDOR", nodeId: "g_corridor", label: "Ground Floor Corridor",  floor: 0 },
    { code: "MP3D-F1-LIFT",    nodeId: "f1_lift_e",  label: "First Floor Lift",       floor: 1 },
    { code: "MP3D-F2-LIFT",    nodeId: "f2_lift_e",  label: "Second Floor Lift",      floor: 2 },
  ]);
  console.log("  ✅ QR Locations");

  console.log("✅ Seeding complete.\n");
}

module.exports = seedIfEmpty;
