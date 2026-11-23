export type FloorId = 0 | 1 | 2;

export interface Department {
  id: string;
  name: string;
  floor: FloorId;
  room: string;
  category: string;
  color: string;
  nodeId: string;
}

export interface HospitalNode {
  id: string;
  label: string;
  floor: FloorId;
  x: number;
  y: number;
  kind: "location" | "corridor" | "lift" | "stairs" | "department";
}

export interface HospitalEdge {
  id: string;
  from: string;
  to: string;
  distance: number;
  type: "walk" | "lift" | "stairs" | "ramp";
  accessible: boolean;
}

export const floorNames = ["Ground Floor", "First Floor", "Second Floor"];

export const initialDepartments: Department[] = [
  {
    id: "emergency",
    name: "Emergency",
    floor: 0,
    room: "101",
    category: "Urgent Care",
    color: "#F43F5E",
    nodeId: "emergency",
  },
  {
    id: "pharmacy",
    name: "Pharmacy",
    floor: 0,
    room: "105",
    category: "Patient Services",
    color: "#00B8A9",
    nodeId: "pharmacy",
  },
  {
    id: "laboratory",
    name: "Laboratory",
    floor: 0,
    room: "110",
    category: "Diagnostics",
    color: "#8B5CF6",
    nodeId: "laboratory",
  },
  {
    id: "orthopedics",
    name: "Orthopedics",
    floor: 1,
    room: "115",
    category: "Specialty Care",
    color: "#F59E0B",
    nodeId: "orthopedics",
  },
  {
    id: "radiology",
    name: "Radiology",
    floor: 1,
    room: "120",
    category: "Diagnostics",
    color: "#1769FF",
    nodeId: "radiology",
  },
  {
    id: "cardiology",
    name: "Cardiology",
    floor: 2,
    room: "205",
    category: "Specialty Care",
    color: "#F43F5E",
    nodeId: "cardiology",
  },
  {
    id: "neurology",
    name: "Neurology",
    floor: 2,
    room: "210",
    category: "Specialty Care",
    color: "#14B8A6",
    nodeId: "neurology",
  },
];

export const nodes: HospitalNode[] = [
  { id: "entrance", label: "Main Entrance", floor: 0, x: 48, y: 88, kind: "location" },
  { id: "reception", label: "Reception", floor: 0, x: 48, y: 68, kind: "location" },
  { id: "g_corridor", label: "Ground Floor Corridor", floor: 0, x: 48, y: 48, kind: "corridor" },
  { id: "g_lift_e", label: "East Lift", floor: 0, x: 72, y: 48, kind: "lift" },
  { id: "g_lift_w", label: "West Lift", floor: 0, x: 24, y: 48, kind: "lift" },
  { id: "g_stairs", label: "Ground Floor Stairs", floor: 0, x: 48, y: 25, kind: "stairs" },
  { id: "emergency", label: "Emergency", floor: 0, x: 12, y: 70, kind: "department" },
  { id: "pharmacy", label: "Pharmacy", floor: 0, x: 83, y: 72, kind: "department" },
  { id: "laboratory", label: "Laboratory", floor: 0, x: 82, y: 25, kind: "department" },
  { id: "f1_corridor", label: "First Floor Corridor", floor: 1, x: 48, y: 48, kind: "corridor" },
  { id: "f1_lift_e", label: "East Lift · Floor 1", floor: 1, x: 72, y: 48, kind: "lift" },
  { id: "f1_lift_w", label: "West Lift · Floor 1", floor: 1, x: 24, y: 48, kind: "lift" },
  { id: "f1_stairs", label: "Stairs · Floor 1", floor: 1, x: 48, y: 25, kind: "stairs" },
  { id: "orthopedics", label: "Orthopedics", floor: 1, x: 15, y: 72, kind: "department" },
  { id: "radiology", label: "Radiology", floor: 1, x: 83, y: 72, kind: "department" },
  { id: "f2_corridor", label: "Second Floor Corridor", floor: 2, x: 48, y: 48, kind: "corridor" },
  { id: "f2_lift_e", label: "East Lift · Floor 2", floor: 2, x: 72, y: 48, kind: "lift" },
  { id: "f2_lift_w", label: "West Lift · Floor 2", floor: 2, x: 24, y: 48, kind: "lift" },
  { id: "f2_stairs", label: "Stairs · Floor 2", floor: 2, x: 48, y: 25, kind: "stairs" },
  { id: "cardiology", label: "Cardiology", floor: 2, x: 82, y: 72, kind: "department" },
  { id: "neurology", label: "Neurology", floor: 2, x: 14, y: 72, kind: "department" },
];

const edge = (
  id: string,
  from: string,
  to: string,
  distance: number,
  type: HospitalEdge["type"] = "walk",
  accessible = true,
): HospitalEdge => ({
  id,
  from,
  to,
  distance,
  type,
  accessible,
});

export const edges: HospitalEdge[] = [
  edge("entrance-reception", "entrance", "reception", 18, "ramp"),
  edge("reception-g", "reception", "g_corridor", 16),
  edge("g-east", "g_corridor", "g_lift_e", 20),
  edge("g-west", "g_corridor", "g_lift_w", 24),
  edge("g-stairs", "g_corridor", "g_stairs", 15),
  edge("g-emergency", "g_corridor", "emergency", 34),
  edge("g-pharmacy", "g_corridor", "pharmacy", 28),
  edge("g-lab", "g_corridor", "laboratory", 32),
  edge("east-01", "g_lift_e", "f1_lift_e", 14, "lift"),
  edge("east-12", "f1_lift_e", "f2_lift_e", 14, "lift"),
  edge("west-01", "g_lift_w", "f1_lift_w", 17, "lift"),
  edge("west-12", "f1_lift_w", "f2_lift_w", 17, "lift"),
  edge("stairs-01", "g_stairs", "f1_stairs", 10, "stairs", false),
  edge("stairs-12", "f1_stairs", "f2_stairs", 10, "stairs", false),
  edge("f1-east", "f1_lift_e", "f1_corridor", 20),
  edge("f1-west", "f1_lift_w", "f1_corridor", 24),
  edge("f1-stairs", "f1_stairs", "f1_corridor", 15),
  edge("f1-ortho", "f1_corridor", "orthopedics", 30),
  edge("f1-radio", "f1_corridor", "radiology", 28),
  edge("f2-east", "f2_lift_e", "f2_corridor", 20),
  edge("f2-west", "f2_lift_w", "f2_corridor", 24),
  edge("f2-stairs", "f2_stairs", "f2_corridor", 15),
  edge("f2-cardio", "f2_corridor", "cardiology", 29),
  edge("f2-neuro", "f2_corridor", "neurology", 31),
];

export const qrLocations = [
  { code: "MP3D-ENTRANCE", nodeId: "entrance", label: "Main Entrance", floor: 0 },
  { code: "MP3D-RECEPTION", nodeId: "reception", label: "Reception", floor: 0 },
  { code: "MP3D-G-CORRIDOR", nodeId: "g_corridor", label: "Ground Floor Corridor", floor: 0 },
  { code: "MP3D-F1-LIFT", nodeId: "f1_lift_e", label: "First Floor Lift", floor: 1 },
  { code: "MP3D-F2-LIFT", nodeId: "f2_lift_e", label: "Second Floor Lift", floor: 2 },
];
