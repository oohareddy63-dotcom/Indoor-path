import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import {
  Accessibility,
  Activity,
  Ambulance,
  ArrowLeftRight,
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardPlus,
  Cross,
  DoorOpen,
  Edit3,
  Eye,
  FlaskConical,
  HeartPulse,
  Home,
  Languages,
  Layers3,
  LayoutDashboard,
  LocateFixed,
  Map,
  MapPin,
  Menu,
  Mic,
  Navigation,
  Plus,
  QrCode,
  Radio,
  RotateCcw,
  ScanLine,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  Volume2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import QRCode from "qrcode";
import {
  floorNames,
  initialDepartments,
  nodes as staticNodes,
  edges as staticEdges,
  qrLocations as staticQrLocations,
  type Department,
  type FloorId,
  type HospitalNode,
  type HospitalEdge,
} from "./data";
import { findAlternative, findRoute, type RouteResult } from "./pathfinding";
import {
  getDepartments,
  getNodes,
  getEdges,
  getQrLocations,
  createDepartment,
  updateDepartment as apiUpdateDepartment,
  deleteDepartment as apiDeleteDepartment,
  blockEdge as apiBlockEdge,
  type QrLocation,
} from "./api";

const Hospital3D = lazy(() => import("./Hospital3D"));

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        home: "Home",
        explore: "Explore Hospital",
        departments: "Find Departments",
        navigation: "Indoor Navigation",
        scan: "Scan QR",
        emergency: "Emergency",
        accessibility: "Accessibility",
        admin: "Admin Dashboard",
        tagline: "Find Your Way. Feel Better.",
        subtitle: "Navigate hospitals effortlessly with intelligent indoor directions.",
        start: "Start navigation",
        current: "Current location",
        destination: "Destination",
        route: "Your route",
        accessible: "Wheelchair accessible",
      },
    },
    hi: {
      translation: {
        home: "होम",
        explore: "अस्पताल देखें",
        departments: "विभाग खोजें",
        navigation: "इनडोर नेविगेशन",
        scan: "QR स्कैन करें",
        emergency: "आपातकाल",
        accessibility: "सुगम्यता",
        admin: "एडमिन डैशबोर्ड",
        tagline: "अपना रास्ता खोजें। बेहतर महसूस करें।",
        subtitle: "बुद्धिमान इनडोर दिशाओं के साथ अस्पताल में आसानी से जाएँ।",
        start: "नेविगेशन शुरू करें",
        current: "वर्तमान स्थान",
        destination: "गंतव्य",
        route: "आपका मार्ग",
        accessible: "व्हीलचेयर सुलभ",
      },
    },
    kn: {
      translation: {
        home: "ಮುಖಪುಟ",
        explore: "ಆಸ್ಪತ್ರೆ ಅನ್ವೇಷಿಸಿ",
        departments: "ವಿಭಾಗಗಳನ್ನು ಹುಡುಕಿ",
        navigation: "ಒಳಾಂಗಣ ನ್ಯಾವಿಗೇಶನ್",
        scan: "QR ಸ್ಕ್ಯಾನ್",
        emergency: "ತುರ್ತು",
        accessibility: "ಪ್ರವೇಶಸಾಧ್ಯತೆ",
        admin: "ನಿರ್ವಾಹಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        tagline: "ನಿಮ್ಮ ದಾರಿ ಹುಡುಕಿ. ಉತ್ತಮವಾಗಿ ಭಾವಿಸಿ.",
        subtitle: "ಬುದ್ಧಿವಂತ ಒಳಾಂಗಣ ನಿರ್ದೇಶನಗಳೊಂದಿಗೆ ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಸುಲಭವಾಗಿ ಸಂಚರಿಸಿ.",
        start: "ನ್ಯಾವಿಗೇಶನ್ ಪ್ರಾರಂಭಿಸಿ",
        current: "ಪ್ರಸ್ತುತ ಸ್ಥಳ",
        destination: "ಗಮ್ಯಸ್ಥಾನ",
        route: "ನಿಮ್ಮ ಮಾರ್ಗ",
        accessible: "ವೀಲ್‌ಚೇರ್ ಪ್ರವೇಶ",
      },
    },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

type Page =
  | "home"
  | "explore"
  | "departments"
  | "navigation"
  | "scan"
  | "emergency"
  | "accessibility"
  | "admin";

const navItems: { id: Page; icon: typeof Home; key: string }[] = [
  { id: "home", icon: Home, key: "home" },
  { id: "explore", icon: Layers3, key: "explore" },
  { id: "departments", icon: Search, key: "departments" },
  { id: "navigation", icon: Navigation, key: "navigation" },
  { id: "scan", icon: ScanLine, key: "scan" },
  { id: "emergency", icon: Ambulance, key: "emergency" },
  { id: "accessibility", icon: Accessibility, key: "accessibility" },
  { id: "admin", icon: LayoutDashboard, key: "admin" },
];

function floorLabel(floor: number) {
  return floorNames[floor] ?? `Floor ${floor}`;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="logo-mark">
        <Cross size={21} strokeWidth={3} />
      </div>
      {!compact && (
        <div>
          <div className="text-[17px] font-extrabold tracking-[-.04em] text-[#102A56]">
            MEDIPATH <span className="text-[#1769FF]">3D</span>
          </div>
          <div className="text-[8px] font-bold tracking-[.18em] text-[#7990AF]">
            SMART HOSPITAL WAYFINDING
          </div>
        </div>
      )}
    </div>
  );
}

interface AppState {
  page: Page;
  setPage: (page: Page) => void;
  currentLocation: string;
  setCurrentLocation: (id: string) => void;
  destination: Department;
  setDestination: (department: Department) => void;
  accessible: boolean;
  setAccessible: (value: boolean) => void;
  blockedEdges: Set<string>;
  setBlockedEdges: (value: Set<string>) => void;
  departments: Department[];
  setDepartments: (value: Department[]) => void;
  liveNodes: HospitalNode[];
  liveEdges: HospitalEdge[];
  liveQrLocations: QrLocation[];
  route: RouteResult | null;
  calculateRoute: (
    alternate?: boolean,
    overrides?: { accessible?: boolean; blockedEdges?: Set<string> },
  ) => void;
  voice: boolean;
  setVoice: (value: boolean) => void;
  notify: (message: string) => void;
  apiReady: boolean;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`toggle ${checked ? "on" : ""}`}
    >
      <span />
    </button>
  );
}

function PageHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[.18em] text-[#1769FF]">
          {eyebrow}
        </div>
        <h1 className="text-3xl font-extrabold tracking-[-.045em] text-[#102A56] sm:text-[38px]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68809F]">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function MiniDepartmentCard({
  department,
  onNavigate,
}: {
  department: Department;
  onNavigate: () => void;
}) {
  const icons: Record<string, typeof Activity> = {
    cardiology: HeartPulse,
    emergency: Ambulance,
    laboratory: FlaskConical,
    pharmacy: ClipboardPlus,
    radiology: Radio,
  };
  const Icon = icons[department.id] ?? Stethoscope;
  return (
    <button onClick={onNavigate} className="quick-card group">
      <span
        className="quick-icon"
        style={{ color: department.color, background: `${department.color}15` }}
      >
        <Icon size={20} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-bold text-[#102A56]">{department.name}</span>
        <span className="block text-[11px] text-[#8295AE]">
          Room {department.room} · {floorLabel(department.floor)}
        </span>
      </span>
      <ChevronRight
        size={16}
        className="text-[#A4B3C7] transition group-hover:translate-x-1 group-hover:text-[#1769FF]"
      />
    </button>
  );
}

function Dashboard({ state }: { state: AppState }) {
  const { t } = useTranslation();
  return (
    <div>
      <section className="hero-grid relative overflow-hidden rounded-[32px] bg-[#102A56] p-7 text-white sm:p-10">
        <div className="relative z-10 max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold tracking-[.14em] text-[#88DCD5]">
            <Sparkles size={13} /> SMARTER HOSPITAL JOURNEYS
          </div>
          <h1 className="text-[40px] font-extrabold leading-[1.03] tracking-[-.055em] sm:text-[58px]">
            {t("tagline")}
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-[#B7C8E0] sm:text-base">
            {t("subtitle")}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => state.setPage("navigation")}
              className="btn-primary !bg-white !text-[#102A56]"
            >
              <Navigation size={17} /> Start navigation
            </button>
            <button onClick={() => state.setPage("explore")} className="btn-ghost">
              <Layers3 size={17} /> Explore in 3D
            </button>
          </div>
        </div>
        <div className="hero-building" aria-hidden="true">
          {[2, 1, 0].map((level) => (
            <div
              key={level}
              className="hero-floor"
              style={{ transform: `translate(${level * 16}px, ${level * -6}px)` }}
            >
              <span />
              <span />
              <span />
            </div>
          ))}
          <div className="hero-pin">
            <MapPin size={22} fill="currentColor" />
          </div>
        </div>
      </section>
      <div className="mt-7 grid gap-4 lg:grid-cols-[1.4fr_.9fr]">
        <section className="panel">
          <div className="section-title">
            <div>
              <h2>Where do you want to go?</h2>
              <p>Popular destinations and essential services</p>
            </div>
            <button onClick={() => state.setPage("departments")} className="text-button">
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {state.departments.slice(0, 6).map((department) => (
              <MiniDepartmentCard
                key={department.id}
                department={department}
                onNavigate={() => {
                  state.setDestination(department);
                  state.setPage("navigation");
                }}
              />
            ))}
          </div>
        </section>
        <section className="panel route-glow">
          <div className="section-title">
            <div>
              <h2>Ready to navigate</h2>
              <p>Live indoor route planner</p>
            </div>
            <span className="status-pill">
              <span /> SYSTEM ONLINE
            </span>
          </div>
          <div className="route-preview">
            <div className="route-stop">
              <span className="dot start" />
              <div>
                <small>YOUR LOCATION</small>
                <strong>{state.liveNodes.find((node) => node.id === state.currentLocation)?.label}</strong>
              </div>
            </div>
            <div className="route-line" />
            <div className="route-stop">
              <span className="dot finish" />
              <div>
                <small>DESTINATION</small>
                <strong>
                  {state.destination.name} · {state.destination.room}
                </strong>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              state.calculateRoute();
              state.setPage("navigation");
            }}
            className="btn-primary mt-5 w-full justify-center"
          >
            <Navigation size={17} /> Calculate fastest route
          </button>
        </section>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["3", "Hospital floors", Layers3],
          ["15+", "Departments", Building2],
          ["QR", "Location support", QrCode],
          ["100%", "Accessible routes", Accessibility],
        ].map(([value, label, Icon]) => (
          <div key={String(label)} className="stat-card">
            <span>
              <Icon size={18} />
            </span>
            <div>
              <strong>{String(value)}</strong>
              <small>{String(label)}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FloorMap({
  floor,
  route,
  destination,
  currentLocation,
  liveNodes,
}: {
  floor: FloorId;
  route: RouteResult | null;
  destination: Department;
  currentLocation: string;
  liveNodes: HospitalNode[];
}) {
  const floorNodes = liveNodes.filter((node) => node.floor === floor);
  const routeNodes =
    route?.nodeIds
      .map((id) => liveNodes.find((node) => node.id === id))
      .filter((node) => node?.floor === floor) ?? [];
  const path = routeNodes
    .map((node, index) => `${index ? "L" : "M"} ${node!.x} ${node!.y}`)
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full min-h-[380px] w-full"
      aria-label={`${floorLabel(floor)} map`}
    >
      <defs>
        <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#DCE8F6" strokeWidth=".3" />
        </pattern>
      </defs>
      <rect width="100" height="100" rx="5" fill="#F8FBFF" />
      <rect width="100" height="100" rx="5" fill="url(#grid)" />
      <path d="M 8 42 H 92 V 56 H 8 Z M 42 15 H 56 V 88 H 42 Z" fill="#E5EEF9" />
      <rect x="5" y="60" width="32" height="28" rx="3" fill="#fff" stroke="#CAD9EB" />
      <rect x="63" y="60" width="32" height="28" rx="3" fill="#fff" stroke="#CAD9EB" />
      <rect x="5" y="12" width="32" height="24" rx="3" fill="#fff" stroke="#CAD9EB" />
      <rect x="63" y="12" width="32" height="24" rx="3" fill="#fff" stroke="#CAD9EB" />
      {path && (
        <path
          d={path}
          fill="none"
          stroke="#1769FF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1 4"
          className="route-path"
        />
      )}
      {floorNodes.map((node) => (
        <g key={node.id}>
          {node.kind === "department" && (
            <text
              x={node.x}
              y={node.y - 4}
              textAnchor="middle"
              fontSize="3.2"
              fontWeight="700"
              fill="#536B89"
            >
              {node.label}
            </text>
          )}
          <circle
            cx={node.x}
            cy={node.y}
            r={
              node.id === currentLocation || node.id === destination.nodeId
                ? 3.2
                : node.kind === "lift"
                  ? 2.2
                  : 1.4
            }
            fill={
              node.id === currentLocation
                ? "#00B8A9"
                : node.id === destination.nodeId
                  ? "#F43F5E"
                  : node.kind === "lift"
                    ? "#102A56"
                    : "#9FB3CC"
            }
            stroke="white"
            strokeWidth="1.2"
          />
        </g>
      ))}
      <g transform="translate(82 91)">
        <rect width="13" height="5" rx="2.5" fill="#102A56" />
        <text x="6.5" y="3.5" textAnchor="middle" fontSize="2.2" fontWeight="700" fill="white">
          EXIT
        </text>
      </g>
    </svg>
  );
}

function Explore({ state }: { state: AppState }) {
  const [floor, setFloor] = useState<FloorId>(0);
  const [mode, setMode] = useState<"3D" | "2D">("3D");
  const [zoom, setZoom] = useState(1);
  return (
    <div>
      <PageHeading
        eyebrow="Digital Twin"
        title="Explore the hospital"
        subtitle="Navigate our interactive building model, select a floor, and tap any department to learn more."
        action={
          <div className="segmented">
            <button onClick={() => setMode("3D")} className={mode === "3D" ? "active" : ""}>
              <Layers3 size={15} /> 3D View
            </button>
            <button onClick={() => setMode("2D")} className={mode === "2D" ? "active" : ""}>
              <Map size={15} /> 2D Map
            </button>
          </div>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
        <div className="panel !p-2">
          {mode === "3D" ? (
            <Suspense
              fallback={
                <div className="flex min-h-[520px] items-center justify-center text-sm text-[#68809F]">
                  Loading hospital model…
                </div>
              }
            >
              <Hospital3D
                selectedFloor={floor}
                onFloorChange={setFloor}
                selectedDepartment={state.destination.id}
                onDepartmentSelect={(id) => {
                  const department = state.departments.find((item) => item.id === id);
                  if (department) state.setDestination(department);
                }}
              />
            </Suspense>
          ) : (
            <div className="relative min-h-[520px] overflow-hidden rounded-[26px] bg-[#F8FBFF]">
              <div
                style={{ transform: `scale(${zoom})` }}
                className="origin-center transition-transform"
              >
                <FloorMap
                  floor={floor}
                  route={state.route}
                  destination={state.destination}
                  currentLocation={state.currentLocation}
                  liveNodes={state.liveNodes}
                />
              </div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="icon-button">
                  <ZoomIn size={17} />
                </button>
                <button onClick={() => setZoom(Math.max(0.8, zoom - 0.1))} className="icon-button">
                  <ZoomOut size={17} />
                </button>
              </div>
            </div>
          )}
        </div>
        <aside className="space-y-4">
          <div className="panel">
            <h3 className="mb-4 text-sm font-extrabold text-[#102A56]">Select a floor</h3>
            <div className="space-y-2">
              {([0, 1, 2] as FloorId[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setFloor(item)}
                  className={`floor-button ${floor === item ? "active" : ""}`}
                >
                  <span>{item === 0 ? "G" : `0${item}`}</span>
                  <div>
                    <strong>{floorLabel(item)}</strong>
                    <small>
                      {item === 0
                        ? "Reception & urgent care"
                        : item === 1
                          ? "Diagnostics & orthopedics"
                          : "Specialty care"}
                    </small>
                  </div>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#7A8DA6]">
              Selected destination
            </div>
            <div className="flex items-center gap-3">
              <span
                className="quick-icon"
                style={{
                  color: state.destination.color,
                  background: `${state.destination.color}15`,
                }}
              >
                <MapPin size={19} />
              </span>
              <div>
                <strong className="block text-sm text-[#102A56]">{state.destination.name}</strong>
                <small className="text-[#7E92AA]">
                  {floorLabel(state.destination.floor)} · Room {state.destination.room}
                </small>
              </div>
            </div>
            <button
              onClick={() => state.setPage("navigation")}
              className="btn-primary mt-4 w-full justify-center"
            >
              Navigate here
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Departments({ state }: { state: AppState }) {
  const [query, setQuery] = useState("");
  const filtered = state.departments.filter((department) =>
    `${department.name} ${department.room} ${department.category}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div>
      <PageHeading
        eyebrow="Hospital Directory"
        title="Find a department"
        subtitle="Search by department name, specialty category, or room number."
      />
      <div className="search-hero">
        <Search size={21} />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try “Cardiology” or room “205”…"
        />
        {query && (
          <button onClick={() => setQuery("")}>
            <X size={17} />
          </button>
        )}
      </div>
      {query && (
        <div className="mt-2 rounded-2xl border border-[#DFE9F5] bg-white p-2 shadow-lg">
          {filtered.slice(0, 4).map((department) => (
            <button
              key={department.id}
              onClick={() => setQuery(department.name)}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-[#F3F7FD]"
            >
              <Search size={14} className="text-[#8CA0B8]" />
              <span className="flex-1 text-sm font-semibold text-[#102A56]">{department.name}</span>
              <small className="text-[#8CA0B8]">Room {department.room}</small>
            </button>
          ))}
        </div>
      )}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((department) => (
          <div key={department.id} className="department-card">
            <div className="flex items-start justify-between">
              <span
                className="quick-icon !h-12 !w-12"
                style={{ color: department.color, background: `${department.color}15` }}
              >
                <Stethoscope size={22} />
              </span>
              <span className="rounded-full bg-[#F3F7FC] px-3 py-1 text-[10px] font-bold text-[#6D819B]">
                {department.category}
              </span>
            </div>
            <h3>{department.name}</h3>
            <p>
              <MapPin size={14} /> {floorLabel(department.floor)} <span /> Room {department.room}
            </p>
            <button
              onClick={() => {
                state.setDestination(department);
                state.setPage("navigation");
                state.notify(`${department.name} selected as your destination.`);
              }}
              className="btn-primary mt-5 w-full justify-center"
            >
              <Navigation size={16} /> Navigate
            </button>
          </div>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty-state">
          <Search size={28} />
          <h3>No departments found</h3>
          <p>Try a department, category, or another room number.</p>
        </div>
      )}
    </div>
  );
}

function directionsFor(route: RouteResult | null, liveNodes: HospitalNode[]) {
  if (!route) return [];
  return route.edges.map((edge, index) => {
    const from = liveNodes.find((node) => node.id === route.nodeIds[index])!;
    const to = liveNodes.find((node) => node.id === route.nodeIds[index + 1])!;
    if (edge.type === "lift") return `Take the lift to ${floorLabel(to.floor)}.`;
    if (edge.type === "stairs") return `Use the stairs to ${floorLabel(to.floor)}.`;
    if (index === route.edges.length - 1)
      return `${to.label} is ahead. Arrive at your destination.`;
    return `Continue from ${from.label} to ${to.label} for ${edge.distance} metres.`;
  });
}

function NavigationPage({ state }: { state: AppState }) {
  const [mapFloor, setMapFloor] = useState<FloorId>(0);
  const [showAlternative, setShowAlternative] = useState(false);
  const directions = directionsFor(state.route, state.liveNodes);
  const currentNode = state.liveNodes.find((node) => node.id === state.currentLocation)!;
  const speak = () => {
    if (!("speechSynthesis" in window))
      return state.notify("Voice guidance is not available in this browser.");
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(directions.join(" ")));
  };
  useEffect(() => {
    if (state.voice && directions.length) speak();
  }, [state.route]); // eslint-disable-line react-hooks/exhaustive-deps
  const routeFloors = [
    ...new Set(
      state.route?.nodeIds.map((id) => state.liveNodes.find((node) => node.id === id)?.floor) ?? [
        currentNode?.floor ?? 0,
      ],
    ),
  ] as FloorId[];
  return (
    <div>
      <PageHeading
        eyebrow="Live Wayfinding"
        title="Indoor navigation"
        subtitle="Routes are calculated live using A* across corridors, lifts, stairs, and floors."
        action={
          <button onClick={() => state.calculateRoute()} className="btn-primary">
            <RotateCcw size={16} /> Recalculate
          </button>
        }
      />
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto]">
        <label className="location-field">
          <small>CURRENT LOCATION</small>
          <select
            value={state.currentLocation}
            onChange={(event) => state.setCurrentLocation(event.target.value)}
          >
            {state.liveQrLocations.map((location) => (
              <option key={location.nodeId} value={location.nodeId}>
                {location.label}
              </option>
            ))}
          </select>
        </label>
        <ArrowLeftRight className="hidden self-center text-[#A4B3C8] md:block" size={18} />
        <label className="location-field">
          <small>DESTINATION</small>
          <select
            value={state.destination.id}
            onChange={(event) =>
              state.setDestination(
                state.departments.find((item) => item.id === event.target.value)!,
              )
            }
          >
            {state.departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name} · {department.room}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => state.calculateRoute()} className="btn-primary justify-center">
          <Navigation size={17} /> Find route
        </button>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#DDE8F4] bg-white p-3">
        <span className="flex items-center gap-2 text-xs font-bold text-[#102A56]">
          <Accessibility size={17} className="text-[#1769FF]" /> Accessible route
        </span>
        <Toggle
          checked={state.accessible}
          onChange={(value) => {
            state.setAccessible(value);
            state.calculateRoute(false, { accessible: value });
          }}
          label="Wheelchair mode"
        />
        <span className="mx-1 h-5 w-px bg-[#E1E9F2]" />
        <span className="flex items-center gap-2 text-xs font-bold text-[#102A56]">
          <Volume2 size={17} className="text-[#00A99B]" /> Voice guidance
        </span>
        <Toggle checked={state.voice} onChange={state.setVoice} label="Voice guidance" />
        {directions.length > 0 && (
          <button
            onClick={speak}
            className="ml-auto flex items-center gap-1.5 text-xs font-bold text-[#1769FF]"
          >
            <Mic size={14} /> Read directions
          </button>
        )}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
        <section className="panel !p-2">
          <div className="relative overflow-hidden rounded-[25px]">
            <FloorMap
              floor={mapFloor}
              route={state.route}
              destination={state.destination}
              currentLocation={state.currentLocation}
              liveNodes={state.liveNodes}
            />
            <div className="absolute left-4 top-4 flex gap-2">
              {([0, 1, 2] as FloorId[]).map((floor) => (
                <button
                  onClick={() => setMapFloor(floor)}
                  className={`map-floor-chip ${mapFloor === floor ? "active" : ""}`}
                  key={floor}
                >
                  {floor === 0 ? "G" : `F${floor}`}
                </button>
              ))}
            </div>
            <div className="absolute bottom-4 left-4 flex gap-4 rounded-xl bg-white/90 px-3 py-2 text-[9px] font-bold text-[#657C98] shadow-sm backdrop-blur">
              <span className="flex items-center gap-1">
                <i className="legend current" /> YOU
              </span>
              <span className="flex items-center gap-1">
                <i className="legend destination" /> DESTINATION
              </span>
              <span className="flex items-center gap-1">
                <i className="legend route" /> ROUTE
              </span>
            </div>
          </div>
        </section>
        <section className="panel">
          {!state.route ? (
            <div className="empty-state !min-h-[350px]">
              <Navigation size={30} />
              <h3>No route calculated</h3>
              <p>Choose a destination and tap Find route.</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-gradient-to-br from-[#1769FF] to-[#0B4CC9] p-5 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[.15em] text-white/70">
                    FASTEST {state.accessible ? "ACCESSIBLE " : ""}ROUTE
                  </span>
                  <ShieldCheck size={18} />
                </div>
                <div className="mt-4 flex items-end gap-5">
                  <div>
                    <strong className="text-3xl font-extrabold">{state.route.distance} m</strong>
                    <small className="block text-white/70">Total distance</small>
                  </div>
                  <div>
                    <strong className="text-xl font-extrabold">
                      {Math.max(2, Math.ceil(state.route.distance / 55))} min
                    </strong>
                    <small className="block text-white/70">Estimated time</small>
                  </div>
                </div>
                <div className="mt-4 flex gap-1">
                  {routeFloors.map((floor, index) => (
                    <span key={floor} className="flex items-center gap-1 text-[10px] font-bold">
                      {index > 0 && <ChevronRight size={11} />}
                      {floor === 0 ? "GROUND" : `FLOOR ${floor}`}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#102A56]">Step-by-step</h3>
                <button
                  onClick={() => {
                    const alt =
                      state.route &&
                      findAlternative(
                        state.currentLocation,
                        state.destination.nodeId,
                        state.route,
                        state.accessible,
                        state.blockedEdges,
                        state.liveEdges.length ? state.liveEdges : undefined,
                        state.liveNodes.length ? state.liveNodes : undefined,
                      );
                    if (alt) {
                      setShowAlternative(true);
                      state.notify(`Alternative route found: ${alt.distance} metres.`);
                    }
                  }}
                  className="text-button"
                >
                  Alternative
                </button>
              </div>
              {showAlternative && (
                <div className="mt-3 rounded-xl bg-[#FFF8E7] p-3 text-xs font-semibold text-[#936C09]">
                  Alternative route is available via the other hospital core. Select Recalculate if
                  your path is blocked.
                </div>
              )}
              <div className="mt-3 max-h-[330px] space-y-1 overflow-auto pr-1">
                {directions.map((direction, index) => (
                  <div className="direction-step" key={`${direction}-${index}`}>
                    <span>{index + 1}</span>
                    <p>{direction}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Scanner({ state }: { state: AppState }) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const identify = (code: string) => {
    const match = state.liveQrLocations.find((location) => location.code === code);
    if (!match) return state.notify("This QR code is not registered with MediPath.");
    state.setCurrentLocation(match.nodeId);
    setResult(match.label);
    state.notify(`Location confirmed: ${match.label}.`);
  };
  const stop = async () => {
    try {
      await scannerRef.current?.stop();
    } catch {
      /* already stopped */
    }
    scannerRef.current = null;
    setScanning(false);
  };
  const start = async () => {
    setScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: 220 },
        (text) => {
          identify(text);
          stop();
        },
        () => {},
      );
    } catch {
      setScanning(false);
      state.notify("Camera could not be opened. Use a demo code or manual location.");
    }
  };
  useEffect(
    () => () => {
      scannerRef.current?.stop().catch(() => {});
    },
    [],
  );
  return (
    <div>
      <PageHeading
        eyebrow="Indoor Positioning"
        title="Scan your location"
        subtitle="Scan a MediPath QR marker to securely identify your exact position inside the hospital."
      />
      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <section className="panel">
          <div className="scanner-frame">
            <div id="qr-reader" className="h-full w-full overflow-hidden rounded-[22px]" />
            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="mb-5 rounded-3xl bg-[#EAF2FF] p-5 text-[#1769FF]">
                  <ScanLine size={42} />
                </span>
                <h3 className="text-lg font-extrabold text-[#102A56]">Ready to scan</h3>
                <p className="mt-2 max-w-xs text-center text-xs leading-5 text-[#7D91AA]">
                  Allow camera access and point it at a MediPath location marker.
                </p>
                <button onClick={start} className="btn-primary mt-5">
                  <ScanLine size={17} /> Open camera
                </button>
              </div>
            )}
            {scanning && (
              <button
                onClick={stop}
                className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#102A56] px-4 py-2 text-xs font-bold text-white"
              >
                Stop scanning
              </button>
            )}
          </div>
          {result && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#E9FBF7] p-4 text-sm font-bold text-[#087D72]">
              <span className="rounded-full bg-[#00B8A9] p-1 text-white">
                <Check size={15} />
              </span>{" "}
              Location confirmed: {result}
            </div>
          )}
        </section>
        <section className="panel">
          <h2 className="text-lg font-extrabold text-[#102A56]">Demo QR locations</h2>
          <p className="mt-1 text-xs text-[#7D91AA]">
            Use a sample code for a camera-free demonstration.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {state.liveQrLocations.map((location) => (
              <DemoQr
                key={location.code}
                code={location.code}
                label={location.label}
                onUse={() => identify(location.code)}
              />
            ))}
          </div>
          <div className="mt-5 border-t border-[#E7EEF6] pt-5">
            <label className="text-xs font-bold text-[#102A56]">Manual fallback</label>
            <select
              onChange={(event) => identify(event.target.value)}
              defaultValue=""
              className="select-field mt-2"
            >
              <option value="" disabled>
                Select your current location
              </option>
              {state.liveQrLocations.map((location) => (
                <option value={location.code} key={location.code}>
                  {location.label} · {floorLabel(location.floor)}
                </option>
              ))}
            </select>
          </div>
        </section>
      </div>
    </div>
  );
}

function DemoQr({ code, label, onUse }: { code: string; label: string; onUse: () => void }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    QRCode.toDataURL(code, {
      width: 130,
      margin: 1,
      color: { dark: "#102A56", light: "#FFFFFF" },
    }).then(setUrl);
  }, [code]);
  return (
    <button onClick={onUse} className="qr-card">
      {url && <img src={url} alt={`Demo QR for ${label}`} />}
      <span>
        <strong>{label}</strong>
        <small>Tap to use location</small>
      </span>
    </button>
  );
}

function AccessibilityPage({ state }: { state: AppState }) {
  const [largeText, setLargeText] = useState(
    document.documentElement.classList.contains("large-text"),
  );
  const [contrast, setContrast] = useState(
    document.documentElement.classList.contains("high-contrast"),
  );
  const setClass = (name: string, value: boolean) =>
    document.documentElement.classList.toggle(name, value);
  const options = [
    {
      icon: Accessibility,
      title: "Wheelchair-friendly routing",
      text: "Avoid stairs and prioritize lifts and ramps.",
      checked: state.accessible,
      set: state.setAccessible,
    },
    {
      icon: Eye,
      title: "Large text mode",
      text: "Increase interface type for easier reading.",
      checked: largeText,
      set: (v: boolean) => {
        setLargeText(v);
        setClass("large-text", v);
      },
    },
    {
      icon: ShieldCheck,
      title: "High contrast mode",
      text: "Boost visual contrast across controls and maps.",
      checked: contrast,
      set: (v: boolean) => {
        setContrast(v);
        setClass("high-contrast", v);
      },
    },
    {
      icon: Volume2,
      title: "Voice guidance",
      text: "Read every navigation instruction aloud.",
      checked: state.voice,
      set: state.setVoice,
    },
  ];
  return (
    <div>
      <PageHeading
        eyebrow="Inclusive by Design"
        title="Accessibility settings"
        subtitle="Personalize MediPath for a safer, more comfortable hospital journey."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {options.map(({ icon: Icon, title, text, checked, set }) => (
          <div className="setting-card" key={title}>
            <span>
              <Icon size={23} />
            </span>
            <div className="flex-1">
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
            <Toggle checked={checked} onChange={set} label={title} />
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-[28px] bg-[#102A56] p-7 text-white">
        <CircleHelp className="text-[#69DDD3]" />
        <h2 className="mt-4 text-2xl font-extrabold">Need personal assistance?</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#B7C9DF]">
          Our reception team can arrange a wheelchair, hospital escort, or language assistance for
          your visit.
        </p>
        <button className="btn-primary mt-5 !bg-white !text-[#102A56]">Call reception</button>
      </div>
    </div>
  );
}

function EmergencyPage({ state }: { state: AppState }) {
  const emergency = state.departments.find((item) => item.id === "emergency")!;
  return (
    <div>
      <PageHeading
        eyebrow="Immediate Assistance"
        title="Emergency help"
        subtitle="If this is a life-threatening emergency, contact hospital staff immediately."
      />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-[30px] bg-gradient-to-br from-[#F43F5E] to-[#C91C3A] p-8 text-white shadow-xl shadow-red-100">
          <Ambulance size={38} />
          <h2 className="mt-8 text-4xl font-extrabold tracking-[-.04em]">Emergency Department</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/80">
            Open 24 hours · Ground Floor · Room 101. Follow red emergency signs from the main
            entrance.
          </p>
          <button
            onClick={() => {
              state.setDestination(emergency);
              state.calculateRoute();
              state.setPage("navigation");
            }}
            className="mt-7 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#C91C3A]"
          >
            Navigate to Emergency
          </button>
        </div>
        <div className="panel">
          <h3 className="font-extrabold text-[#102A56]">Quick contacts</h3>
          {[
            ["Hospital emergency", "108"],
            ["Reception desk", "080 4000 1200"],
            ["Security", "080 4000 1211"],
          ].map(([label, phone]) => (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="mt-3 flex items-center justify-between rounded-2xl bg-[#F6F9FD] p-4"
              key={label}
            >
              <span className="text-sm font-bold text-[#102A56]">{label}</span>
              <strong className="text-sm text-[#1769FF]">{phone}</strong>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function Admin({ state }: { state: AppState }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    room: "",
    floor: 0 as FloorId,
    category: "Specialty Care",
  });
  const openEdit = (department?: Department) => {
    setEditing(department ?? null);
    setDraft(
      department
        ? {
            name: department.name,
            room: department.room,
            floor: department.floor,
            category: department.category,
          }
        : { name: "", room: "", floor: 0, category: "Specialty Care" },
    );
    setShowForm(true);
  };
  const save = async () => {
    if (!draft.name || !draft.room) return state.notify("Department name and room are required.");
    if (editing) {
      try {
        const updated = await apiUpdateDepartment(editing.id, draft);
        state.setDepartments(state.departments.map((item) => (item.id === editing.id ? updated : item)));
        state.notify("Department updated.");
      } catch (err: any) {
        // Fallback to local update if API unavailable
        state.setDepartments(state.departments.map((item) => (item.id === editing.id ? { ...item, ...draft } : item)));
        state.notify("Department updated (offline).");
      }
    } else {
      const id = `custom-${Date.now()}`;
      try {
        const created = await createDepartment({ id, color: "#1769FF", node_id: "reception", ...draft });
        state.setDepartments([...state.departments, created]);
        state.notify("Department added.");
      } catch {
        state.setDepartments([...state.departments, { id, nodeId: "reception", color: "#1769FF", ...draft }]);
        state.notify("Department added (offline).");
      }
    }
    setShowForm(false);
  };
  const removeDepartment = async (id: string) => {
    if (state.departments.length <= 1) return;
    try {
      await apiDeleteDepartment(id);
    } catch {
      // fall through — remove from local state regardless
    }
    state.setDepartments(state.departments.filter((item) => item.id !== id));
    state.notify("Department removed.");
  };
  const toggleEdge = async (id: string) => {
    const next = new Set(state.blockedEdges);
    const blocking = !next.has(id);
    blocking ? next.add(id) : next.delete(id);
    state.setBlockedEdges(next);
    // Sync with backend
    try { await apiBlockEdge(id, blocking); } catch { /* offline */ }
    if (blocking && state.route?.edges.some((edge) => edge.id === id)) {
      state.calculateRoute(true, { blockedEdges: next });
      state.notify("Your current route is unavailable. An alternative route has been calculated.");
    } else state.notify(blocking ? "Connection marked unavailable." : "Connection restored.");
  };
  return (
    <div>
      <PageHeading
        eyebrow="Operations Center"
        title="Admin dashboard"
        subtitle="Manage hospital wayfinding data, locations, and live pathway availability."
        action={
          <button onClick={() => openEdit()} className="btn-primary">
            <Plus size={17} /> Add department
          </button>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["7", "Registered locations", MapPin],
          [String(state.departments.length), "Departments", Building2],
          [String(state.blockedEdges.size), "Unavailable paths", DoorOpen],
          [state.apiReady ? "LIVE" : "LOCAL", state.apiReady ? "API connected" : "Offline mode", QrCode],
        ].map(([value, label, Icon]) => (
          <div key={String(label)} className="admin-stat">
            <span>
              <Icon size={19} />
            </span>
            <div>
              <strong>{String(value)}</strong>
              <small>{String(label)}</small>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <section className="panel overflow-hidden !p-0">
          <div className="section-title border-b border-[#E7EEF6] p-5">
            <div>
              <h2>Departments & rooms</h2>
              <p>Live demonstration data</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Floor</th>
                  <th>Room</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.departments.map((department) => (
                  <tr key={department.id}>
                    <td>
                      <span className="dept-dot" style={{ background: department.color }} />
                      {department.name}
                    </td>
                    <td>{floorLabel(department.floor)}</td>
                    <td>{department.room}</td>
                    <td>
                      <button
                        onClick={() => openEdit(department)}>
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => removeDepartment(department.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <div className="section-title">
            <div>
              <h2>Live route controls</h2>
              <p>Simulate service interruptions</p>
            </div>
            <span className="status-pill">
              <span /> LIVE
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {state.liveEdges
              .filter((edge) => edge.type === "lift" || edge.id.includes("corridor"))
              .slice(0, 6)
              .map((edge) => (
                <div className="availability-row" key={edge.id}>
                  <span className={edge.type === "lift" ? "lift" : ""}>
                    {edge.type === "lift" ? <ChevronDown size={17} /> : <DoorOpen size={17} />}
                  </span>
                  <div>
                    <strong>
                      {edge.type === "lift"
                        ? edge.id.startsWith("east")
                          ? "East lift"
                          : "West lift"
                        : edge.id.replace(/-/g, " ")}
                    </strong>
                    <small>
                      {edge.from} → {edge.to}
                    </small>
                  </div>
                  <Toggle
                    checked={!state.blockedEdges.has(edge.id)}
                    onChange={() => toggleEdge(edge.id)}
                    label={`Availability for ${edge.id}`}
                  />
                </div>
              ))}
          </div>
          <div className="mt-5 rounded-2xl bg-[#EEF5FF] p-4 text-xs leading-5 text-[#496787]">
            <strong className="block text-[#1769FF]">Try the rerouting demo</strong>Calculate an
            accessible route to Cardiology, then turn off East lift east-01 or east-12. A* will
            recalculate through the West lift.
          </div>
        </section>
      </div>
      {showForm && (
        <div className="modal-backdrop" onMouseDown={() => setShowForm(false)}>
          <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2>{editing ? "Edit department" : "Add department"}</h2>
                <p>Update hospital directory information.</p>
              </div>
              <button className="icon-button" onClick={() => setShowForm(false)}>
                <X size={17} />
              </button>
            </div>
            <div className="mt-6 grid gap-4">
              <label className="form-label">
                Department name
                <input
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="form-label">
                  Room number
                  <input
                    value={draft.room}
                    onChange={(event) => setDraft({ ...draft, room: event.target.value })}
                  />
                </label>
                <label className="form-label">
                  Floor
                  <select
                    value={draft.floor}
                    onChange={(event) =>
                      setDraft({ ...draft, floor: Number(event.target.value) as FloorId })
                    }
                  >
                    {floorNames.map((name, index) => (
                      <option key={name} value={index}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="form-label">
                Category
                <select
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                >
                  <option>Specialty Care</option>
                  <option>Diagnostics</option>
                  <option>Patient Services</option>
                  <option>Urgent Care</option>
                </select>
              </label>
              <button onClick={save} className="btn-primary mt-2 justify-center">
                {editing ? "Save changes" : "Add department"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { t } = useTranslation();
  const [page, setPage] = useState<Page>("home");
  const [mobileNav, setMobileNav] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("entrance");
  const [departments, setDepartments] = useState(initialDepartments);
  const [destination, setDestination] = useState(
    initialDepartments.find((item) => item.id === "cardiology")!,
  );
  const [accessible, setAccessible] = useState(false);
  const [voice, setVoice] = useState(false);
  const [blockedEdges, setBlockedEdges] = useState(new Set<string>());
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [toast, setToast] = useState("");
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3600);
  };
  const calculateRoute = (
    alternate = false,
    overrides?: { accessible?: boolean; blockedEdges?: Set<string> },
  ) => {
    const result = findRoute(
      currentLocation,
      destination.nodeId,
      {
        accessible: overrides?.accessible ?? accessible,
        blockedEdges: overrides?.blockedEdges ?? blockedEdges,
      },
      liveEdges.length ? liveEdges : undefined,
      liveNodes.length ? liveNodes : undefined,
    );
    setRoute(result);
    if (!result) notify("No available route. Please contact reception for assistance.");
    else if (alternate) notify("An alternative route has been calculated.");
  };

  // Live data from backend API
  const [liveNodes, setLiveNodes] = useState<HospitalNode[]>(staticNodes);
  const [liveEdges, setLiveEdges] = useState<HospitalEdge[]>(staticEdges);
  const [liveQrLocations, setLiveQrLocations] = useState<QrLocation[]>(staticQrLocations);
  const [apiReady, setApiReady] = useState(false);

  useEffect(() => {
    // Load all data from backend; fall back to static data on error
    Promise.all([
      getDepartments(),
      getNodes(),
      getEdges(),
      getQrLocations(),
    ])
      .then(([depts, nodes, edgesData, qrLocs]) => {
        setDepartments(depts);
        const dest = depts.find((d) => d.id === "cardiology") ?? depts[0];
        if (dest) setDestination(dest);
        setLiveNodes(nodes);
        // Strip the extra "blocked" field when storing edges for pathfinding
        setLiveEdges(edgesData.map(({ blocked: _b, ...e }) => e));
        setLiveQrLocations(qrLocs);
        setApiReady(true);
        notify("Connected to MediPath backend.");
      })
      .catch(() => {
        // Backend not reachable — silently continue with static data
        setApiReady(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const state: AppState = {
    page,
    setPage,
    currentLocation,
    setCurrentLocation,
    destination,
    setDestination,
    accessible,
    setAccessible,
    blockedEdges,
    setBlockedEdges,
    departments,
    setDepartments,
    liveNodes,
    liveEdges,
    liveQrLocations,
    route,
    calculateRoute,
    voice,
    setVoice,
    notify,
    apiReady,
  };
  const currentPage = useMemo(() => {
    switch (page) {
      case "explore":
        return <Explore state={state} />;
      case "departments":
        return <Departments state={state} />;
      case "navigation":
        return <NavigationPage state={state} />;
      case "scan":
        return <Scanner state={state} />;
      case "emergency":
        return <EmergencyPage state={state} />;
      case "accessibility":
        return <AccessibilityPage state={state} />;
      case "admin":
        return <Admin state={state} />;
      default:
        return <Dashboard state={state} />;
    }
  }, [page, currentLocation, destination, accessible, blockedEdges, departments, liveNodes, liveEdges, liveQrLocations, route, voice]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="min-h-screen bg-[#F4F8FF] text-[#102A56]">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="flex items-center justify-between px-5 py-6">
          <Logo />
          <button onClick={() => setMobileNav(false)} className="lg:hidden">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-3">
          {navItems.map(({ id, icon: Icon, key }) => (
            <button
              key={id}
              onClick={() => {
                setPage(id);
                setMobileNav(false);
              }}
              className={`nav-item ${page === id ? "active" : ""}`}
            >
              <Icon size={18} />
              <span>{t(key)}</span>
              {id === "emergency" && <i />}
            </button>
          ))}
        </nav>
        <div className="m-4 rounded-2xl bg-[#EAF2FF] p-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#1769FF]">
            <ShieldCheck size={16} /> {state.apiReady ? "MongoDB Connected" : "Navigation online"}
          </div>
          <p className="mt-2 text-[10px] leading-4 text-[#6681A2]">
            {state.apiReady ? "Live data from Atlas database." : "All three floors mapped and ready."}
          </p>
        </div>
        <div className="border-t border-[#E4ECF6] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#102A56] text-xs font-bold text-white">
              AK
            </div>
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-xs">Arun Kumar</strong>
              <small className="text-[10px] text-[#8093AA]">Visitor</small>
            </div>
            <Settings2 size={16} className="text-[#92A3B8]" />
          </div>
        </div>
      </aside>
      <div className="lg:pl-[248px]">
        <header className="topbar">
          <button onClick={() => setMobileNav(true)} className="icon-button lg:hidden">
            <Menu size={18} />
          </button>
          <div className="hidden items-center gap-2 text-xs font-semibold text-[#8092A8] sm:flex">
            <Home size={14} />
            <ChevronRight size={12} />
            <span className="capitalize text-[#102A56]">
              {t(navItems.find((item) => item.id === page)?.key ?? "home")}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <label className="header-search hidden xl:flex">
              <Search size={15} />
              <input placeholder="Search hospital…" onFocus={() => setPage("departments")} />
            </label>
            <label className="language-select">
              <Languages size={15} />
              <select
                value={i18n.language}
                onChange={(event) => i18n.changeLanguage(event.target.value)}
              >
                <option value="en">EN</option>
                <option value="hi">हिं</option>
                <option value="kn">ಕನ್</option>
              </select>
            </label>
            <button onClick={() => setPage("accessibility")} className="icon-button">
              <Accessibility size={17} />
            </button>
            <button className="icon-button relative">
              <Bell size={17} />
              <span className="notification-dot" />
            </button>
            <div className="ml-1 hidden h-8 w-px bg-[#E2EAF3] sm:block" />
            <button className="hidden items-center gap-2 sm:flex">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#1769FF] to-[#00B8A9] text-xs font-bold text-white">
                AK
              </div>
              <ChevronDown size={14} className="text-[#8B9DB1]" />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{currentPage}</main>
      </div>
      {toast && (
        <div className="toast">
          <span>
            <Check size={15} />
          </span>
          {toast}
          <button onClick={() => setToast("")}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
