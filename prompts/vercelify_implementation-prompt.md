# Vercelify — Prompt: Vercel-identische Verwaltungsoberfläche für Coolify

## Projektübersicht

Baue eine vollständige Webanwendung namens **Vercelify** als persönliche Verwaltungsoberfläche für eine selbst-gehostete Coolify-Infrastruktur. Die Oberfläche soll **visuell und funktional identisch mit dem Vercel Dashboard 2026** sein — basierend auf Vercels eigenem **Geist Design System**. Das Projekt besteht aus einem React-Frontend und einem Node.js-Backend-Proxy.

**Das zentrale Feature:** Wenn ein neues App-Deployment-Projekt angelegt wird, wird automatisch eine dedizierte Supabase-Instanz über die Coolify API erstellt, mit der App verbunden, und in der Projekt-Overview als direkter Link zu Supabase Studio angezeigt. Genau wie Vercel + Supabase Cloud — nur vollständig self-hosted.

---

## Infrastruktur-Kontext

```
infra-01 (138.199.209.224) — CX33
├── Coolify (Port 8000)
├── Supabase Instanzen (dynamisch erstellt pro Projekt)
└── Coolify API: http://138.199.209.224:8000/api/v1

apps-01 (178.104.195.24) — CX23
├── Vercelify (Frontend + Backend, Port 3001)
└── Alle App-Deployments
```

---

## Tech Stack

### Frontend
- React 18 mit TypeScript
- Tailwind CSS v4
- React Router v6
- TanStack Query v5
- `geist` npm package (Geist Sans + Geist Mono Font)
- `geist-colors` npm package (Vercels exaktes Farbsystem)
- Lucide React für Icons
- Recharts für Charts
- Axios

### Backend
- Node.js + Express + TypeScript
- `jsonwebtoken` (JWT Auth)
- `bcrypt` (Passwort-Hashing)
- `helmet` (Security Headers)
- `cors`
- `express-rate-limit`
- `dotenv`
- `axios` (Coolify API Proxy)

### Monorepo-Struktur

```
vercelify/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── ui/
│   │   │   ├── projects/
│   │   │   ├── deployments/
│   │   │   └── supabase/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   │   ├── coolify.service.ts
│   │   │   └── supabase-provision.service.ts
│   │   └── types/
│   ├── package.json
│   └── tsconfig.json
├── package.json
└── README.md
```

---

## Vercel Geist Design System — Exakte Implementierung

### CSS Custom Properties

```css
:root {
  /* Backgrounds */
  --background:           #000000;
  --background-secondary: #0A0A0A;

  /* Gray Ramp — pure neutral, keine warm/cool Töne */
  --gray-100: #F7F7F7;
  --gray-200: #E5E5E5;
  --gray-300: #D4D4D4;
  --gray-400: #A3A3A3;
  --gray-500: #737373;
  --gray-600: #525252;
  --gray-700: #404040;
  --gray-800: #262626;
  --gray-900: #171717;
  --gray-950: #0A0A0A;

  /* Accent — NUR für Links, Primary Buttons, Active States */
  --blue: #0070F3;

  /* Status */
  --success: #00C853;
  --error:   #EE0000;
  --warning: #F5A623;

  /* Borders — barely visible */
  --border-default: rgba(255, 255, 255, 0.08);
  --border-strong:  rgba(255, 255, 255, 0.15);

  /* Text */
  --foreground:           #FFFFFF;
  --foreground-secondary: #A3A3A3;
}
```

### Typografie — Geist Font

```css
:root {
  --font-sans: 'Geist Sans', -apple-system, system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'SFMono-Regular', monospace;

  --text-xs:   12px;
  --text-sm:   14px;  /* primäre UI-Größe */
  --text-base: 16px;
  --text-lg:   18px;
  --text-xl:   24px;
  --text-2xl:  32px;

  /* Kritisch für Vercel-Look */
  --tracking-tight:  -0.04em;  /* Headlines */
  --tracking-normal: -0.01em;  /* Body */
  --leading-tight:   1.15;
  --leading-base:    1.5;
}
```

### Shape & Spacing

```css
:root {
  --radius-sm: 4px;   /* Badges */
  --radius-md: 6px;   /* Buttons, Inputs */
  --radius-lg: 8px;   /* Cards, Modals */

  /* 8px Base Grid */
  --space-1:  4px;    --space-2:  8px;
  --space-3:  12px;   --space-4:  16px;
  --space-6:  24px;   --space-8:  32px;
  --space-12: 48px;   --space-16: 64px;
}
```

### Was Vercel NICHT verwendet — strikt einhalten
- Keine Gradienten auf UI-Elementen
- Keine Schatten (dark background braucht keine Tiefe)
- Keine Illustrationen
- `--blue` NUR für Links, Primary Buttons, Active States
- Border Radius niemals über 8px
- Borders fast unsichtbar (8% Opacity)

---

## Das Kern-Feature: Automatische Supabase-Provisionierung

### Konzept

Wenn ein Nutzer in Vercelify ein neues Projekt anlegt, passiert folgendes automatisch:

```
Nutzer klickt "New Project"
        │
        ▼
Wizard: Name, GitHub Repo, Branch, Environment
        │
        ▼
Backend: POST /api/v1/services → Coolify API
  → type: "supabase"
  → name: "{projektname}-supabase-{environment}"
  → server_uuid: infra-01 UUID
        │
        ▼ (parallel)
Backend: POST /api/v1/applications → Coolify API
  → GitHub Repo verbinden
  → server_uuid: apps-01 UUID
        │
        ▼
Warten bis Supabase "Running (healthy)" — Polling alle 5s
        │
        ▼
Backend: GET /api/v1/services/{uuid}/environment
  → SERVICE_SUPABASEANON_KEY auslesen
  → SERVICE_URL_SUPABASEKONG auslesen (Studio URL)
        │
        ▼
Backend: PUT /api/v1/applications/{uuid}/envs
  → NEXT_PUBLIC_SUPABASE_URL      = Kong URL
  → NEXT_PUBLIC_SUPABASE_ANON_KEY = Anon Key
  → SUPABASE_SERVICE_ROLE_KEY     = Service Role Key
        │
        ▼
Dashboard: Projekt-Overview zeigt
  ├── App Status + Deployment URL
  └── 🔗 "Open Supabase Studio" Button
```

### Supabase Keys automatisch abrufen

Die Coolify API gibt nach dem Deployment folgende Environment Variables zurück:

| Coolify Variable | Wird zu App-Variable |
|---|---|
| `SERVICE_SUPABASEANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SERVICE_URL_SUPABASEKONG` | `NEXT_PUBLIC_SUPABASE_URL` |
| `SERVICE_PASSWORD_POSTGRES` | DB Passwort (intern) |
| `SERVICE_USER_ADMIN` | Studio Login User |
| `SERVICE_PASSWORD_ADMIN` | Studio Login Passwort |

### Projekt-Datenmodell (Backend-intern in `projects.json`)

Da Coolify keine Verbindung zwischen App und Supabase kennt, speichert Vercelify diese Verknüpfung selbst:

```typescript
interface VercelifyProject {
  id: string;
  name: string;
  environment: 'production' | 'preview' | 'development';
  createdAt: string;

  // Coolify Referenzen
  coolifyProjectUuid:   string;
  appServiceUuid:       string;  // App auf apps-01
  supabaseServiceUuid:  string;  // Supabase auf infra-01

  // Abgeleitete URLs (gecacht)
  appUrl:              string;
  supabaseStudioUrl:   string;
  supabaseAnonKey:     string;   // maskiert gespeichert

  // GitHub
  gitRepo:   string;
  gitBranch: string;
}
```

---

## Vercel Dashboard Navigation — Exakte Struktur (2026)

### Sidebar (240px, kollabierbar)

```
┌─────────────────────────┐
│  ▲ Vercelify            │  ← Logo + App Name
│  ───────────────────    │
│  Overview               │
│  Projects           ●   │  ← aktiver Tab (weißer Border-Indicator)
│  Deployments            │
│  Services               │  ← Supabase Instanzen
│  Servers                │
│  ───────────────────    │
│  Settings               │
│                         │
│  [◀ collapse]           │  ← kollabierbar auf 40px (Icon-only)
└─────────────────────────┘
```

**Vercel 2026 Sidebar-Verhalten:**
- Kollabierbar auf Icon-only (40px Breite)
- Consistent Tabs — gleiche Navigation auf Team + Projekt-Ebene
- Projects as Filters — Projekt auswählen filtert alle Tabs
- Aktiver Tab: weißer 2px linker Border-Indicator
- Mobile: Floating Bottom Bar

### Breadcrumb (Header)

```
Vercelify  /  Projects  /  radar  /  Deployments
```

12px, `--gray-400`, alle Segmente klickbar

---

## Alle Seiten im Detail

### 1. Login (`/login`)

- `background: #000000`
- Zentriertes Card: `background: #111111`, `border: 1px solid rgba(255,255,255,0.08)`, `border-radius: 8px`, `padding: 32px`
- "▲ Vercelify" Logo oben zentriert, Geist Sans
- Passwort-Input: dunkler Hintergrund, subtiler Border
- Primary Button: `background: #FFFFFF`, `color: #000000`, `border-radius: 6px`, volle Breite
- Enter-Taste submittiert
- Fehlerstate: rote Border am Input + Fehlermeldung

---

### 2. Overview (`/`)

```
Good morning, Niko                         Sa, 18. April 2026
──────────────────────────────────────────────────────────────

SERVER STATUS
┌──────────────────────┐  ┌──────────────────────┐
│ ● infra-01           │  │ ● apps-01            │
│ RAM ████░░ 4.2/8 GB  │  │ RAM ██░░░░ 1.1/4 GB  │
│ CPU: 2 Cores         │  │ CPU: 2 Cores         │
│ Uptime: 3d 4h        │  │ Uptime: 3d 4h        │
│ [Open Coolify ↗]     │  │                      │
└──────────────────────┘  └──────────────────────┘

RECENT DEPLOYMENTS
● radar        main  a3f9b2c  "Fix auth bug"     2m ago
● radar-dev    dev   b1c4d5e  "Add new feature"  1h ago

SUPABASE INSTANCES
● radar-supabase-prod    Running    [Open Studio →]
● radar-supabase-dev     Running    [Open Studio →]
```

---

### 3. Projects (`/projects`)

Grid 3-spaltig (Desktop), 1-spaltig (Mobile):

```
┌──────────────────────────────┐
│ radar                        │
│ ● Ready — main               │
│ a3f9b2c "Fix auth bug"       │
│ apps-01 · 2m ago             │
│ https://radar.178.104...     │
│ [Open Studio →]              │  ← Supabase Studio Link
└──────────────────────────────┘
```

**"+ New Project"** Button oben rechts → öffnet New Project Wizard

---

### 4. New Project Wizard (`/projects/new`)

Multi-Step wie Vercel:

**Step 1 — Repository**
```
Import Git Repository
─────────────────────
[Search repos...]

● WMCNiko/radar          main   [Import →]
● WMCNiko/andere-app     main   [Import →]
```

**Step 2 — Configure**
```
Project Name:     [radar                    ]
Environment:      [● Production         ▼  ]
Branch:           [main                     ]
Build Command:    [npm run build             ]
Output Dir:       [dist                     ]
Server:           [apps-01               ▼  ]

──────────────────────────────────────────────
Supabase (automatisch):
✅ Create Supabase instance automatically
   Name: radar-supabase-production (auto-generiert)
   Server: infra-01
```

**Step 3 — Deploy (Live-Progress)**
```
Deploying radar...

✅ Creating Coolify project
✅ Connecting GitHub repository
⟳ Deploying Supabase instance...
  └─ Pulling Docker images (2/10 containers running)
◌ Configuring environment variables
◌ Starting app deployment
◌ Running build
```

Polling der Coolify API alle 3 Sekunden, Live-Update ohne Page-Reload.

---

### 5. Project Detail (`/projects/:id`)

**Header:**
```
radar                                   [Visit ↗]  [Redeploy]
● Ready  apps-01  main  2m ago
🔗 Supabase Studio →    (Link zur automatisch erstellten Instanz)
```

**Tabs:** `Overview | Deployments | Environment Variables | Settings`

**Overview Tab:**
- Production Deployment Card (groß, prominent)
- Supabase Instance Card:
  ```
  ┌──────────────────────────────────────┐
  │ 🗄 Supabase                          │
  │ radar-supabase-production            │
  │ ● Running (healthy)                  │
  │ [Open Studio →]    [View Keys]       │
  └──────────────────────────────────────┘
  ```
- Letzte 5 Deployments als kompakte Liste

**Deployments Tab:**
- Filter: Production / All
- Pro Zeile: Status Dot, Commit Message, Branch, Hash (Geist Mono), Zeit, Duration
- Klick → Deployment Detail mit Build Logs

**Environment Variables Tab:**
```
Key                            Value        Environment
NEXT_PUBLIC_SUPABASE_URL       ••••••••  👁  Production
NEXT_PUBLIC_SUPABASE_ANON_KEY  ••••••••  👁  Production
SUPABASE_SERVICE_ROLE_KEY      ••••••••  👁  Production
MY_CUSTOM_VAR                  ••••••••  👁  Production

[+ Add Variable]
```

- Werte standardmäßig maskiert, Auge-Icon zum Anzeigen
- Inline-Editing (Klick auf Zeile)
- `SUPABASE_*` Variablen sind **readonly** mit Hinweis: _"Managed automatically by Vercelify"_

**Settings Tab:**
- General: Name, Framework, Build Command, Output Dir, Port
- Git: Branch, Auto-Deploy Toggle
- Danger Zone: Stop App, Delete Project (löscht App + Supabase Instanz in Coolify)

---

### 6. Deployment Detail (`/deployments/:id`)

```
● Ready                                           radar / main
https://radar.178.104.195.24                  2m ago · 1m 23s

BUILD LOG ──────────────────────────────────────────────────────
[12:34:01.123]  Cloning repository...
[12:34:02.456]  Installing dependencies...
[12:34:15.789]  Running: npm run build
[12:34:45.123]  ✓ Build complete (30s)
[12:34:45.456]  Starting container...
[12:34:46.789]  ✓ Deployment ready
```

Geist Mono, 13px, farbige Prefixe (grün für ✓, rot für ✗, gelb für ⚠)

---

### 7. Services (`/services`)

Zeigt alle Supabase-Instanzen die über Vercelify erstellt wurden:

```
SUPABASE INSTANCES
──────────────────────────────────────────────────────────────
radar-supabase-production    ● Running    [Open Studio →]
  └─ Linked to: radar (production)
  └─ Kong, Auth, Storage, Realtime — all healthy

radar-supabase-dev           ● Running    [Open Studio →]
  └─ Linked to: radar (development)
```

Pro Instanz aufklappbar:
- Sub-Container Status (alle ~10 Supabase-Container)
- Dashboard Credentials (User/Password, maskiert mit Auge-Icon)
- Restart / Stop Buttons

---

### 8. Servers (`/servers`)

```
infra-01                           ● Proxy Running
138.199.209.224                    Ubuntu 24.04 · CX33

RAM   [████████░░░░] 4.2 / 8.0 GB
CPU   2 vCores
Disk  [██░░░░░░░░░░] 8.1 / 74.8 GB
Uptime: 3 days, 4 hours

RESOURCES (8)
● radar-supabase-prod    Service    Running
● radar-supabase-dev     Service    Running
```

---

### 9. Settings (`/settings`)

Sections mit horizontalen Dividers, exakt wie Vercel:

**Dashboard**
- Passwort ändern (aktuelles + neues + bestätigen)

**Coolify Connection**
- API URL: `http://138.199.209.224:8000/api/v1`
- API Token: `••••••••` mit Auge-Icon
- [Test Connection] Button → zeigt Coolify Version + Status

**Default Server Targets**
- Infra Server (für Supabase): `infra-01` Dropdown
- Apps Server (für Deployments): `apps-01` Dropdown

**Danger Zone**
- [Reset all project links] — löscht `projects.json`

---

## Backend — Vollständige Spezifikation

### Umgebungsvariablen (.env)

```env
PORT=3001
JWT_SECRET=minimum-32-zeichen-random-string
JWT_EXPIRES_IN=24h
DASHBOARD_PASSWORD_HASH=bcrypt-hash
COOLIFY_API_URL=http://138.199.209.224:8000/api/v1
COOLIFY_API_TOKEN=coolify-api-token
COOLIFY_INFRA_SERVER_UUID=uuid-von-infra-01
COOLIFY_APPS_SERVER_UUID=uuid-von-apps-01
COOLIFY_DEFAULT_PROJECT_UUID=uuid-des-coolify-projekts
CORS_ORIGIN=http://localhost:5173
DATA_PATH=./data/projects.json
```

### Middleware Stack

```
Request
  → helmet()           Security Headers
  → cors()             nur CORS_ORIGIN erlaubt
  → rate-limit()       100 req/15min allgemein
  → express.json()
  → authMiddleware()   JWT verify (außer /api/auth/login)
  → Route Handler
  → Coolify API Proxy
  → Response
```

### Alle API Endpunkte

#### Auth
```
POST   /api/auth/login          → { token, expiresAt }
POST   /api/auth/logout         → { success }
GET    /api/auth/verify         → { valid }
```

#### Projects (Vercelify-eigene Logik)
```
GET    /api/projects                     → alle Projekte (projects.json + Coolify Status)
POST   /api/projects                     → Neues Projekt (App + Supabase automatisch)
GET    /api/projects/:id                 → Projekt Detail
DELETE /api/projects/:id                 → Projekt + Supabase löschen
GET    /api/projects/:id/supabase-keys   → Anon Key + Studio URL
```

**`POST /api/projects` — Der wichtigste Endpunkt:**

```typescript
// Request Body
interface CreateProjectRequest {
  name:          string;
  gitRepo:       string;
  gitBranch:     string;
  environment:   'production' | 'development';
  buildCommand:  string;
  outputDir:     string;
  port:          number;
  createSupabase: boolean; // default: true
}

// Ablauf im Backend:
// 1. POST /api/v1/services
//    → type: "supabase", name: "{name}-supabase-{env}"
//    → server_uuid: COOLIFY_INFRA_SERVER_UUID
// 2. Polling GET /api/v1/services/{uuid}
//    → warten bis status === "running" (max 10min, alle 5s)
// 3. GET /api/v1/services/{uuid}/environment
//    → SERVICE_SUPABASEANON_KEY, SERVICE_URL_SUPABASEKONG auslesen
// 4. POST /api/v1/applications
//    → GitHub Repo verbinden, server_uuid: COOLIFY_APPS_SERVER_UUID
// 5. PUT /api/v1/applications/{uuid}/envs
//    → NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY setzen
// 6. Verknüpfung in projects.json persistieren
// 7. Response: { project: VercelifyProject }
```

#### Applications (Coolify Proxy)
```
GET    /api/applications/:uuid              → App Details
POST   /api/applications/:uuid/deploy       → Deploy starten
POST   /api/applications/:uuid/restart      → Restart
POST   /api/applications/:uuid/stop         → Stop
GET    /api/applications/:uuid/logs         → Logs
GET    /api/applications/:uuid/environment  → ENV Vars (maskiert)
PUT    /api/applications/:uuid/environment  → ENV Vars setzen (nicht SUPABASE_* Keys)
PUT    /api/applications/:uuid/settings     → Build-Einstellungen
```

#### Services (Coolify Proxy)
```
GET    /api/services                → alle Services
GET    /api/services/:uuid          → Detail
POST   /api/services/:uuid/restart  → Restart
POST   /api/services/:uuid/stop     → Stop
```

#### Deployments
```
GET    /api/deployments             → History (?limit=20&app=uuid)
GET    /api/deployments/:uuid       → Detail + Logs
```

#### Servers
```
GET    /api/servers                 → alle Server
GET    /api/servers/:uuid           → Detail
PUT    /api/servers/:uuid           → Einstellungen ändern
POST   /api/servers/:uuid/validate  → Revalidate
```

#### Config
```
GET    /api/config                  → Dashboard-Konfiguration
PUT    /api/config                  → Konfiguration speichern
POST   /api/config/test-connection  → Coolify API testen
```

### Sicherheit
- Coolify API Token **niemals** an den Browser senden — nur Server-zu-Server
- `SUPABASE_*` ENV-Vars readonly — nur automatisch gesetzt, nie manuell editierbar
- Alle sensitiven Werte maskiert (`••••••••`) — Auge-Icon für explizites Anzeigen
- Rate Limiting: 5 Login-Versuche/15min, 100 allgemein/15min
- JWT 24h Ablauf, automatischer Logout im Frontend

---

## Geist Komponenten — Vollständige Liste

| Komponente | Verwendung |
|---|---|
| `StatusDot` | App/Server/Supabase Status (grün/rot/gelb) |
| `Badge` + `Pill` | "● Ready", "⟳ Building", "✕ Error" |
| `Button` Primary | `bg-white text-black` — Deploy, Create, Login |
| `Button` Secondary | `bg-gray-900 text-white` — Restart, Stop, Cancel |
| `Button` Danger | `bg-red-600 text-white` — Delete |
| `Skeleton` | Loading States auf allen Seiten |
| `Spinner` | Inline Loading (z.B. Supabase bootet) |
| `Toast` | Erfolg/Fehler Notifications (oben rechts) |
| `Modal` | Confirmations — Projekt-Name eintippen bei Delete |
| `Tabs` | Project Detail, Settings |
| `Table` | ENV Vars, Deployments Liste |
| `Input` | Forms — Login, New Project, Settings |
| `Toggle` | Auto-Deploy an/aus |
| `Progress` | RAM/CPU, Supabase Boot-Fortschritt |
| `Tooltip` | Hover-Infos auf Icons + gekürzte Texte |
| `Empty State` | Keine Projekte/Deployments vorhanden |
| `Loading Dots` | Build läuft / Supabase bootet |
| `Snippet` | Commit Hash (Geist Mono) |
| `Code Block` | Build Logs (Geist Mono, farbige Log-Level) |

---

## UX-Prinzipien (Vercel Developer-First)

1. **Speed over sparkle** — keine unnötigen Animationen, kein Splash Screen
2. **Relative Time** — "2m ago", "1h ago" statt absoluten Timestamps
3. **Optimistic Updates** — UI reagiert sofort, auch wenn API noch nicht geantwortet hat
4. **Auto-Refresh** — Status-Daten alle 30 Sekunden automatisch aktualisiert
5. **Skeleton Loading** — niemals leere Seiten, immer Skeleton während Laden
6. **Destructive Actions mit Confirmation** — Projekt-Name eintippen um Delete zu bestätigen
7. **Browser Tab Status** — Tab-Titel und Icon zeigen aktuellen Deployment-Status
8. **Readonly Supabase Vars** — klar markiert als _"Managed automatically by Vercelify"_
9. **Supabase Boot-Progress** — beim neuen Projekt Fortschrittsbalken mit Container-Status
10. **Mobile Bottom Bar** — Floating Navigation auf Mobile (wie Vercel 2026)

---

## Dockerfile — Multi-Stage Build

```dockerfile
# Stage 1: Frontend Build
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend + Frontend serving
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./
RUN npm run build
COPY --from=frontend-build /app/frontend/dist ./public
RUN mkdir -p ./data
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

Backend served das Frontend-Build als statische Dateien unter `/`. Alle `/api/*` Requests gehen an den Proxy. Das `data/` Verzeichnis als Volume in Coolify mounten für Persistenz von `projects.json`.

---

## Implementierungs-Reihenfolge

1. Monorepo-Struktur + beide `package.json` anlegen
2. Backend: Express + TypeScript Grundstruktur
3. Backend: Auth-Middleware (JWT + bcrypt)
4. Backend: Coolify API Service (generischer Proxy)
5. Backend: Supabase Provisioning Service (Kern-Feature)
6. Backend: Projects-Endpunkte mit `projects.json` Persistenz
7. Backend: Alle restlichen Proxy-Endpunkte
8. Frontend: Vite + React + TypeScript + Tailwind + Geist Font
9. Frontend: CSS Design Tokens exakt nach Spezifikation
10. Frontend: Layout-Komponente (Sidebar kollabierbar + Header + Breadcrumb)
11. Frontend: Alle UI-Basiskomponenten (Button, Badge, StatusDot, Toast, Modal, Skeleton...)
12. Frontend: Login-Seite
13. Frontend: Overview/Dashboard
14. Frontend: Projects-Liste
15. Frontend: New Project Wizard (3 Steps + Live-Progress)
16. Frontend: Project Detail (alle 4 Tabs)
17. Frontend: Deployment Detail mit Logs
18. Frontend: Services (Supabase Instanzen)
19. Frontend: Servers
20. Frontend: Settings
21. Dockerfile bauen + testen
22. In Coolify auf `apps-01` deployen

---

## Was Vercelify NICHT ist

- Kein vollständiger Coolify-Ersatz
- Keine Docker-Verwaltung auf OS-Ebene
- Keine Supabase-Datenverwaltung (nur Link zu Studio)
- Kein Multi-User System (nur ein Admin-Passwort)
- Kein Edge-Netzwerk oder CDN
