import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Html, OrbitControls, RoundedBox } from "@react-three/drei";
import { Building2 } from "lucide-react";
import type { FloorId } from "./data";

interface Hospital3DProps {
  selectedFloor: FloorId;
  onFloorChange: (floor: FloorId) => void;
  selectedDepartment?: string;
  onDepartmentSelect: (id: string) => void;
}

const floorDepartments = [
  [
    { id: "emergency", name: "Emergency", x: -2.8 },
    { id: "pharmacy", name: "Pharmacy", x: 2.5 },
  ],
  [
    { id: "orthopedics", name: "Orthopedics", x: -2.6 },
    { id: "radiology", name: "Radiology", x: 2.5 },
  ],
  [
    { id: "neurology", name: "Neurology", x: -2.6 },
    { id: "cardiology", name: "Cardiology", x: 2.5 },
  ],
];

function Floor({
  floor,
  selectedFloor,
  selectedDepartment,
  onFloorChange,
  onDepartmentSelect,
}: Hospital3DProps & { floor: FloorId }) {
  const y = floor * 2.05;
  const selected = floor === selectedFloor;
  return (
    <group
      position={[0, y, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onFloorChange(floor);
      }}
    >
      <RoundedBox args={[8.4, 0.32, 5.5]} radius={0.12} smoothness={3}>
        <meshStandardMaterial
          color={selected ? "#DCEAFF" : "#EEF4FC"}
          metalness={0.05}
          roughness={0.55}
        />
      </RoundedBox>
      {[-3.5, 0, 3.5].map((x) => (
        <RoundedBox key={x} position={[x, 0.85, 0]} args={[0.14, 1.55, 5]} radius={0.04}>
          <meshStandardMaterial color="#A9C7E8" transparent opacity={selected ? 0.65 : 0.3} />
        </RoundedBox>
      ))}
      {floorDepartments[floor].map((department) => {
        const active = selectedDepartment === department.id;
        return (
          <group
            key={department.id}
            position={[department.x, 0.65, 0]}
            onClick={(event) => {
              event.stopPropagation();
              onFloorChange(floor);
              onDepartmentSelect(department.id);
            }}
          >
            <RoundedBox args={[2.2, 1.1, 2.35]} radius={0.14}>
              <meshStandardMaterial color={active ? "#1769FF" : selected ? "#65A3FF" : "#B9CDE8"} />
            </RoundedBox>
            {(selected || active) && (
              <Html position={[0, 1.05, 0]} center distanceFactor={9}>
                <button className={`three-label ${active ? "active" : ""}`}>
                  {department.name}
                </button>
              </Html>
            )}
          </group>
        );
      })}
      <RoundedBox position={[0, 0.75, 0]} args={[1.25, 1.35, 2]} radius={0.12}>
        <meshStandardMaterial color={selected ? "#00B8A9" : "#94B8C5"} />
      </RoundedBox>
    </group>
  );
}

export default function Hospital3D(props: Hospital3DProps) {
  return (
    <div className="relative h-full min-h-[430px] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#e8f3ff] via-white to-[#dff8f6]">
      <div className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs font-bold text-[#102A56] shadow-sm backdrop-blur">
        <Building2 size={15} className="text-[#1769FF]" /> INTERACTIVE 3D MODEL
      </div>
      <Canvas camera={{ position: [10, 9, 11], fov: 42 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#eef6ff"]} />
        <ambientLight intensity={1.3} />
        <directionalLight position={[7, 12, 6]} intensity={2.2} castShadow />
        <group position={[0, -2.1, 0]}>
          {([0, 1, 2] as FloorId[]).map((floor) => (
            <Floor key={floor} floor={floor} {...props} />
          ))}
          <RoundedBox position={[0, -0.55, 0]} args={[9.4, 0.7, 6.5]} radius={0.22}>
            <meshStandardMaterial color="#C9DDF4" />
          </RoundedBox>
        </group>
        <ContactShadows position={[0, -2.65, 0]} opacity={0.3} scale={16} blur={2.5} far={10} />
        <Environment preset="city" />
        <OrbitControls
          enablePan={false}
          minDistance={10}
          maxDistance={23}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[#102A56]/85 px-4 py-2 text-[11px] font-semibold text-white backdrop-blur">
        Drag to rotate · Scroll to zoom · Click a floor
      </div>
    </div>
  );
}
