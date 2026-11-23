# MediPath 3D — Smart Hospital Indoor Navigation

> A full-stack **MERN** application that lets patients and visitors navigate a multi-floor hospital using real-time 3D models, A\* pathfinding, QR code location scanning, and voice-guided directions.

---

## Table of Contents

- [Live Demo](#live-demo)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1 — Clone the repo](#1--clone-the-repo)
  - [2 — Backend setup](#2--backend-setup)
  - [3 — Frontend setup](#3--frontend-setup)
  - [4 — Run both servers](#4--run-both-servers)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Pathfinding Algorithm](#pathfinding-algorithm)
- [Pages & Functionality](#pages--functionality)

---

## Live Demo



## Tech Stack

### Frontend — React (M**E**RN)
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 8 | Dev server + bundler |
| Tailwind CSS | v4 | Utility-first styling |
| Three.js | 0.187 | 3D hospital model |
| @react-three/fiber | 9 | React renderer for Three.js |
| @react-three/drei | 10 | Three.js helpers (OrbitControls, etc.) |
| i18next | 27 | EN / Hindi / Kannada translations |
| html5-qrcode | 2.3 | Camera-based QR scanning |
| qrcode | 1.5 | QR code image generation |
| lucide-react | 1.78 | Icon library |

### Backend — Express + Node.js (MER**N**)
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 24 | Runtime |
| Express | 4 | HTTP framework |
| Mongoose | 9 | MongoDB ODM |
| dotenv | 18 | Environment variable loading |
| cors | 2 | Cross-origin resource sharing |

### Database — MongoDB Atlas (M**ern**)
| Technology | Purpose |
|---|---|
| MongoDB Atlas | Cloud-hosted NoSQL database |
| Mongoose Schemas | Type-safe document models |
| Auto-seed | Hospital graph seeded on first run |

---

## Features

| Feature | Description |
|---|---|
| **Interactive 3D Model** | Three-floor hospital rendered in WebGL via Three.js — drag to rotate, scroll to zoom, click floors/departments |
| **2D SVG Floor Maps** | Animated route overlay on a pixel-perfect 2D floor plan per floor |
| **A\* Pathfinding** | Dijkstra-based A\* over a graph of 21 nodes and 24 edges — corridors, lifts, stairs, ramps |
| **Wheelchair Mode** | Filters out non-accessible edges (stairs) and biases toward lifts |
| **Voice Guidance** | Web Speech API reads step-by-step directions aloud |
| **QR Location Scanning** | html5-qrcode opens the device camera; matching a printed QR marker sets the user's floor position |
| **Demo QR Codes** | Auto-generated QR code cards for camera-free demo/testing |
| **Multi-language** | English, Hindi (हिंदी), Kannada (ಕನ್ನಡ) via react-i18next |
| **Admin Dashboard** | Full CRUD for departments (persists to MongoDB), live edge blocking to simulate closures |
| **Live Rerouting** | Blocking a lift or corridor mid-navigation triggers A\* to recalculate an alternative route |
| **Accessibility Settings** | Wheelchair routing, large text mode, high contrast mode, voice toggle |
| **Emergency Page** | One-tap navigation to Emergency Department + quick-dial phone numbers |
| **API-first with fallback** | Frontend loads all data from backend on mount; silently falls back to static data if offline |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React)                      │
│  Vite Dev Server  :8443                                  │
│                                                          │
│  src/App.tsx  ──useEffect──▶  src/api.ts                │
│  src/pathfinding.ts (A*)       fetch("/api/*")           │
│  src/Hospital3D.tsx (Three.js)       │                   │
│                                      │  Vite proxy       │
└──────────────────────────────────────┼──────────────────┘
                                       │ /api/* → :3001
┌──────────────────────────────────────▼──────────────────┐
│                  Express API  :3001                       │
│                                                          │
│  GET/POST/PUT/DELETE  /api/departments                   │
│  GET                  /api/nodes                         │
│  GET + PUT            /api/edges  (+ /:id/block)         │
│  GET                  /api/qr-locations                  │
│  GET                  /api/health                        │
│                                                          │
│  server/routes/   ──▶  server/models/ (Mongoose)        │
└──────────────────────────────┬──────────────────────────┘
                               │  TLS / SSL
┌──────────────────────────────▼──────────────────────────┐
│              MongoDB Atlas  (Cloud)                       │
│                                                          │
│  Collections:                                            │
│    departments   nodes   edges   qrlocations             │
│                                                          │
│  Auto-seeded with full hospital graph on first run       │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
BuildMediPath3DNavigation/
│
├── src/                          # React frontend (TypeScript)
│   ├── App.tsx                   # Root component — all 8 pages, shared state
│   ├── api.ts                    # Typed fetch client for the Express API
│   ├── pathfinding.ts            # A* algorithm (uses live data from backend)
│   ├── Hospital3D.tsx            # Lazy-loaded Three.js 3D hospital model
│   ├── data.ts                   # Static fallback data + TypeScript types
│   ├── index.css                 # Global CSS + Tailwind v4 import
│   └── main.tsx                  # React entry point
│
├── server/                       # Express backend (Node.js)
│   ├── index.js                  # App entry — connects MongoDB, registers routes
│   ├── seed.js                   # One-time data seeder (runs if DB is empty)
│   ├── models/
│   │   ├── Department.js         # Mongoose schema — departments collection
│   │   ├── Node.js               # Mongoose schema — nodes collection
│   │   ├── Edge.js               # Mongoose schema — edges collection
│   │   └── QrLocation.js         # Mongoose schema — qrlocations collection
│   ├── routes/
│   │   ├── departments.js        # GET/POST/PUT/DELETE /api/departments
│   │   ├── nodes.js              # GET /api/nodes
│   │   ├── edges.js              # GET /api/edges, PUT /api/edges/:id/block
│   │   └── qrLocations.js        # GET /api/qr-locations
│   ├── .env.example              # Template for environment variables
│   └── package.json
│
├── public/
│   └── favicon.png
│
├── index.html                    # Vite HTML shell
├── vite.config.ts                # Vite config — React, Tailwind, /api proxy
├── tsconfig.json
├── package.json                  # Frontend dependencies (pnpm)
├── pnpm-lock.yaml
└── README.md
```

---

## Getting Started

### Prerequisites

| Tool | Minimum version | Install |
|---|---|---|
| Node.js | 22+ | https://nodejs.org |
| pnpm | 8+ | `npm install -g pnpm` |
| MongoDB Atlas | Free tier | https://cloud.mongodb.com |
| Git | any | https://git-scm.com |

---

### 1 — Clone the repo

```bash
git clone https://github.com/oohareddy63-dotcom/Indoor-path.git
cd Indoor-path
```

---

### 2 — Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Open `server/.env` and fill in your MongoDB Atlas connection string:

```env
MONGODB_URI=mongodb://<user>:<password>@<shard-00>:27017,<shard-01>:27017,<shard-02>:27017/?ssl=true&authSource=admin&appName=<cluster>
API_PORT=3001
```

> **How to get the connection string from Atlas:**
> 1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
> 2. Click your cluster → **Connect** → **Drivers**
> 3. Choose **Node.js** driver → toggle **Legacy URI String** ON
> 4. Copy the string and replace `<db_password>` with your Atlas user password
> 5. Make sure your current IP is in **Network Access** → **IP Access List**

Start the backend:

```bash
node index.js
```

On first run you will see:

```
✅  Connected to MongoDB Atlas
🌱 Seeding hospital data into MongoDB...
  ✅ Departments
  ✅ Nodes (hospital graph)
  ✅ Edges (corridors, lifts, stairs)
  ✅ QR Locations
✅ Seeding complete.

🏥  MediPath API  →  http://localhost:3001
    Health check  →  http://localhost:3001/api/health
```

---

### 3 — Frontend setup

Open a **new terminal** at the project root:

```bash
pnpm install
```

---

### 4 — Run both servers

**Terminal 1 — Backend:**
```bash
cd server
node index.js
```

**Terminal 2 — Frontend:**
```bash
pnpm dev
```

Open **http://localhost:8443** in your browser.

The Vite dev server proxies all `/api/*` requests to `http://localhost:3001` automatically — no CORS configuration needed.

---

## Environment Variables

All backend environment variables live in `server/.env` (never committed).

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | ✅ Yes | — | Full MongoDB Atlas connection string |
| `API_PORT` | No | `3001` | Port the Express API listens on |

---

## API Reference

Base URL: `http://localhost:3001`

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Returns `{ status, db, timestamp }` |

### Departments

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/departments` | — | List all departments |
| POST | `/api/departments` | `{ id, name, floor, room, category, color, nodeId }` | Create department |
| PUT | `/api/departments/:id` | `{ name?, floor?, room?, category?, color? }` | Update department |
| DELETE | `/api/departments/:id` | — | Delete department |

### Nodes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/nodes` | List all 21 hospital graph nodes |

### Edges

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/edges` | — | List all 24 edges with `blocked` status |
| PUT | `/api/edges/:id/block` | `{ blocked: boolean }` | Block or unblock a path |

### QR Locations

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/qr-locations` | List all 5 QR scan points |

---

## Database Schema

### Department
```js
{
  id:       String,   // unique slug e.g. "cardiology"
  name:     String,   // display name
  floor:    Number,   // 0 | 1 | 2
  room:     String,   // e.g. "205"
  category: String,   // "Specialty Care" | "Diagnostics" | ...
  color:    String,   // hex colour for UI
  nodeId:   String    // references a Node.id for pathfinding
}
```

### Node
```js
{
  id:    String,   // unique e.g. "g_lift_e"
  label: String,   // human-readable
  floor: Number,   // 0 | 1 | 2
  x:     Number,   // SVG coordinate (0–100)
  y:     Number,   // SVG coordinate (0–100)
  kind:  String    // "location"|"corridor"|"lift"|"stairs"|"department"
}
```

### Edge
```js
{
  id:         String,   // unique e.g. "east-01"
  from:       String,   // Node.id
  to:         String,   // Node.id
  distance:   Number,   // metres
  type:       String,   // "walk"|"lift"|"stairs"|"ramp"
  accessible: Boolean   // false for stairs
}
```

### QrLocation
```js
{
  code:   String,   // QR payload e.g. "MP3D-ENTRANCE"
  nodeId: String,   // matches Node.id
  label:  String,   // display name
  floor:  Number    // 0 | 1 | 2
}
```

---

## Pathfinding Algorithm

`src/pathfinding.ts` implements **A\* (A-star)** over the hospital's graph:

- **Nodes** — 21 points (entrances, corridors, lifts, stairs, departments)
- **Edges** — 24 weighted, directed connections
- **Heuristic** — Manhattan distance on (x, y) + floor change penalty (×8m)
- **Options:**
  - `accessible: true` — skips `accessible: false` edges (stairs) and biases toward lifts (−2m)
  - `blockedEdges: Set<string>` — skips admin-blocked edges at runtime
  - `avoidEdges: Set<string>` — adds +60m penalty (used for alternative route)
- **Live data** — when the backend is connected, the algorithm runs on MongoDB-sourced edges/nodes; falls back to static data offline

---

## Pages & Functionality

| Page | Route key | Highlights |
|---|---|---|
| **Home** | `home` | Hero banner, quick-nav department cards, live route preview |
| **Explore** | `explore` | Interactive 3D model (Three.js) + 2D SVG map, floor selector |
| **Departments** | `departments` | Search by name / category / room, navigate button |
| **Navigation** | `navigation` | Location + destination selectors, A\* route, floor map, step-by-step, wheelchair + voice toggles |
| **Scan QR** | `scan` | Camera scanner, 5 auto-generated demo QR cards, manual fallback select |
| **Emergency** | `emergency` | Emergency dept navigation, 3 quick-dial contacts |
| **Accessibility** | `accessibility` | Wheelchair routing, large text, high contrast, voice guidance |
| **Admin** | `admin` | Department CRUD (MongoDB-backed), live lift/corridor blocking with auto-reroute |

---

## Screenshots

> *Run the app locally at http://localhost:8443 to see all features.*

**Home Dashboard**
- Full-screen hero with animated 3D building
- Quick-access department shortcuts
- Live route preview card showing current location → destination

**Explore (3D/2D)**
- WebGL hospital model with clickable floors and departments
- 2D floor plan with animated dashed route path

**Navigation**
- Real-time A\* route displayed on SVG floor map
- Blue gradient route summary card showing distance + estimated time
- Numbered step-by-step direction list

**Admin Dashboard**
- Department table with inline edit / delete
- Live route control toggles (block lifts, corridors)
- Badge shows "MongoDB Connected" / "Offline mode"

---

## Author

**Ooha Reddy** — [github.com/oohareddy63-dotcom](https://github.com/oohareddy63-dotcom)

---

## License

This project is for portfolio / interview demonstration purposes.
