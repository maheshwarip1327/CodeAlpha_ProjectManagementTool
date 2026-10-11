# TaskFlow Pro — Premium Full-Stack Project Management SaaS

> **Tagline:** Plan Smarter. Collaborate Better. Deliver Faster.  
> **CodeAlpha Full Stack Development Internship — Project 2**  
> **Built by:** Full-Stack Engineer, SaaS Product Designer & QA Engineer

---

## 🌟 Executive Overview

**TaskFlow Pro** is a production-minded, full-featured MERN (MongoDB, Express, React, Node.js) SaaS platform designed for modern product teams, agencies, and developers to organize projects, manage tasks through real-time Kanban boards, track milestones across timeline/Gantt schedules, and generate analytical performance reports.

Unlike prototypes or mockup dashboards, **TaskFlow Pro** is an end-to-end operational web application with strict multi-tenant authorization boundaries, JWT httpOnly cookie security, real-time Socket.IO synchronization, comprehensive CSV report streaming, and complete automated test suites for both frontend and backend.

---

## 🚀 Key Feature Matrix

| Module | Features & Capabilities |
| :--- | :--- |
| **Landing Page** | Public SaaS presentation, hero section, interactive UI product preview, feature comparison matrix, testimonials, FAQ accordion, and pricing tiers. |
| **Authentication & RBAC** | JWT authentication via secure `httpOnly` cookies & headers, bcrypt password hashing (12 rounds), forgot/reset password with crypto tokens, session verification, workspace switching, and profile settings. |
| **Multi-Tenant Workspaces** | Workspace-level isolation (`owner`, `admin`, `member`, `guest`), project-level permissions (`owner`, `lead`, `member`, `viewer`), cross-tenant security shields. |
| **Project Workspace** | 9 functional tabs: **Overview, Board, List, Calendar, Timeline, Members, Files, Activity, and Settings**. Archive/restore lifecycle, progress indicators, priority & status tagging. |
| **Kanban Board** | 5 workflow columns: *Backlog*, *To Do*, *In Progress*, *In Review*, and *Completed*. Real-time drag-and-drop powered by `@hello-pangea/dnd` with automatic fallback rollback on network failures. |
| **Task Management** | Subtasks/checklist with real-time progress calculations, file attachments (Multer), threaded comments, priorities (*Low*, *Medium*, *High*, *Urgent*), tags, and overdue deadline detection. |
| **Multiple Views** | Synchronized across **Board View**, searchable/sortable **List View**, interactive **Calendar View** (month-by-month grid), and **Timeline View** (horizontal duration tracks). |
| **Real-Time Collaboration** | Socket.IO bi-directional events: tasks created/moved/updated, live comment notifications, and instant activity stream broadcasts across connected team members. |
| **Reports & Analytics** | Real-time workspace analytics, task distribution charts (Recharts), project progress gauges, team workload indicators, and streaming **CSV export**. |
| **Admin Panel** | Protected platform management (`/admin`) for system administrators with stats overview, user management, and workspace monitoring. |

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 with Vite & TypeScript
- **Styling:** Tailwind CSS with a modern SaaS palette (Navy `#0f172a`, Indigo `#6366f1`, Cyan `#06b6d4`)
- **Icons:** Lucide React
- **Routing:** React Router v6 with authenticated route wrappers
- **Drag & Drop:** `@hello-pangea/dnd`
- **Charts:** Recharts
- **HTTP Client:** Axios with credentials (`withCredentials: true`) & Bearer token fallback interceptor
- **Real-Time:** Socket.IO Client (`socket.io-client`)
- **Testing:** Vitest + React Testing Library + jsdom

### Backend
- **Runtime:** Node.js (ES Modules) + Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT) stored in `httpOnly`, `sameSite: 'lax'` cookies + Bearer auth
- **Security:** Helmet, CORS with explicit origin allowlist, rate limiting (`express-rate-limit`), mongo sanitization
- **File Uploads:** Multer with mime-type whitelisting and size limits
- **Validation:** Zod schemas for all request payloads
- **Real-Time Engine:** Socket.IO Server with project room subscription management
- **Testing:** Vitest + Supertest

---

## 📦 Project Structure

```text
Project_Management_Tool_CodeAlpha/
├── package.json                    # Monorepo root scripts (dev, test, seed, build)
├── README.md                       # Comprehensive documentation & setup guide
├── server/                         # Backend Express + MongoDB API
│   ├── package.json                # Server scripts & dependencies
│   ├── .env.example                # Template environment variables
│   ├── .env                        # Local active environment configuration
│   ├── src/
│   │   ├── server.js               # HTTP + Socket.IO server entrypoint
│   │   ├── app.js                  # Express middleware, security, and routes
│   │   ├── config/
│   │   │   └── db.js               # MongoDB Mongoose connection
│   │   ├── models/                 # Mongoose schemas: User, Workspace, Project, Task, etc.
│   │   ├── middleware/             # auth.js, projectAuth.js, validate.js, errorHandler.js, upload.js
│   │   ├── controllers/            # auth, workspace, project, task, comment, report, admin...
│   │   ├── routes/                 # Express API routes
│   │   ├── sockets/                # socketHandler.js (room management & events)
│   │   └── utils/                  # token.js, logger.js
│   ├── scripts/
│   │   ├── seed.js                 # Seed script with realistic projects, tasks, & demo users
│   │   └── createAdmin.js          # CLI script to securely create the first system admin
│   └── tests/
│       └── api.test.js             # Vitest + Supertest API integration & security suite
└── client/                         # Frontend React + Vite + Tailwind + TypeScript
    ├── package.json                # Client dependencies & build scripts
    ├── vite.config.ts              # Vite configuration with proxy to port 5000
    ├── tailwind.config.js          # Tailwind CSS theme extension
    ├── src/
    │   ├── main.tsx                # React DOM entrypoint
    │   ├── App.tsx                 # Routes, AuthProvider, Toaster container
    │   ├── types/index.ts          # Complete TypeScript interfaces & types
    │   ├── lib/
    │   │   ├── api.ts              # Axios singleton with credentials & base URL
    │   │   └── utils.ts            # Formatting, priority colors, badges, initials
    │   ├── context/
    │   │   └── AuthContext.tsx     # Session management, workspace switching, Socket.IO
    │   ├── components/
    │   │   ├── common/             # Sidebar, Header, Modal, EmptyState, Skeletons...
    │   │   ├── projects/           # CreateProjectModal
    │   │   └── tasks/              # TaskCard, TaskDetailsModal, CreateTaskModal
    │   ├── pages/                  # LandingPage, DashboardPage, ProjectsPage, ProjectWorkspacePage,
    │   │                           # MyTasksPage, CalendarPage, TimelinePage, TeamPage, ReportsPage,
    │   │                           # SettingsPage, ProfilePage, HelpPage, AdminPage, NotFoundPage
    │   └── test/
    │       └── App.test.tsx        # Vitest + RTL unit tests
```

---

## ⚙️ Environment Setup & Configuration

### Prerequisites
- **Node.js**: v18.0.0 or later (tested on v24.14.0)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI

### Server Environment (`server/.env`)
Create `server/.env` with the following variables:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/taskflow_pro
JWT_SECRET=super_secret_taskflow_pro_jwt_key_2026_dev
JWT_EXPIRES_IN=7d
COOKIE_SECRET=taskflow_cookie_signing_secret_2026
UPLOAD_DIR=uploads
```

---

## 🏃 Running the Application

### 1. Install Dependencies
Run from the root directory:
```bash
npm run install:all
```
*(Or navigate into `server/` and `client/` and run `npm install` respectively).*

### 2. Seed Database with Realistic Demo Data
Populate the database with demo users, organizations, multi-department projects, subtasks, checklists, attachments, and activity history:
```bash
npm run seed
```
**Seed Demo Credentials:**
- **Email:** `alex.morgan@taskflow.demo`
- **Password:** `Password123!`
- *(Additional seeded team members: `sarah.chen@taskflow.demo`, `marcus.vance@taskflow.demo`, `elena.rostova@taskflow.demo` with the same password).*

### 3. Create the First System Administrator
Create a super-admin account via the secure CLI tool:
```bash
npm run admin:create
```
*Or provide custom credentials via CLI arguments:*
```bash
npm run admin:create -- admin@mycompany.com "SuperSecretPass2026!" "Master Admin"
```
Default Administrator credentials created by script:
- **Email:** `admin@taskflowpro.com`
- **Password:** `AdminSecret2026!`

### 4. Start the Development Servers
In two separate terminal windows or run sequentially:

**Terminal 1 (Backend API & WebSockets on port 5000):**
```bash
npm run dev:server
```

**Terminal 2 (Frontend Client on port 5173):**
```bash
npm run dev:client
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## 🧪 Automated Testing & Security Verification

Both frontend and backend suites are automated using Vitest and can be executed via the root runner:

```bash
npm test
```

### Backend Test Results (`server/tests/api.test.js`)
- **11 / 11 PASSED**
- ✅ `GET /health` — Verifies API health and MongoDB database connection status.
- ✅ `POST /api/auth/register` — Verifies user registration and automatic default workspace generation.
- ✅ `POST /api/auth/login` — Verifies JWT generation and cookie transmission.
- ✅ `POST /api/projects` — Verifies creation of private workspace projects.
- ✅ **SECURITY TEST:** Verifies that an authenticated User B **cannot read** User A's private project (returns `403 Forbidden`).
- ✅ **SECURITY TEST:** Verifies that an authenticated User B **cannot modify** User A's private project (returns `403 Forbidden`).
- ✅ `POST /api/tasks` — Verifies task creation with project assignment.
- ✅ `PATCH /api/tasks/:id/status` — Verifies Kanban column transition logic.
- ✅ `GET /api/reports` — Verifies authorized workspace metrics aggregation.
- ✅ `GET /api/reports/export-csv` — Verifies authorized CSV streaming.

### Frontend Test Results (`client/src/test/App.test.tsx`)
- **6 / 6 PASSED**
- ✅ Landing page hero headline and CTAs render properly.
- ✅ Priority badge color calculation utility (`urgent`, `high`, `medium`, `low`).
- ✅ User initials extraction utility.
- ✅ Date formatting and relative time calculator.
- ✅ Status badge text and border styling utility.
- ✅ Empty state component with action button callbacks.

### Production Build Verification
```bash
npm run build:client
```
Output:
```text
✓ built in 5.78s
dist/index.html                     0.97 kB
dist/assets/index.css              43.10 kB
dist/assets/index.js            1,024.70 kB
```

---

## 🔒 Security & Architecture Principles

1. **Strict Multi-Tenant Isolation:** Project and workspace queries strictly verify user membership. An unauthorized user attempting to fetch or mutate resources by guessing an Object ID receives an immediate `403 Forbidden`.
2. **Safe Authentication:** Passwords hashed with bcrypt (12 salt rounds). Tokens delivered through `httpOnly`, `sameSite: 'lax'` cookies to prevent client-side XSS exfiltration, with optional `Authorization: Bearer` headers supported for flexibility.
3. **Optimistic UI with Failure Rollback:** The Kanban board utilizes optimistic state updates for instant tactile responsiveness. If the server rejects the move or the connection drops, the task automatically reverts to its original column with an error toast alert.
4. **Real-Time Data Propagation:** When any user updates a task or leaves a comment, Socket.IO broadcasts the payload exclusively to sockets joined to the corresponding project room, ensuring immediate synchronization without costly polling loops.
5. **Sanitized Input & Schema Validation:** Zod schemas validate every API endpoint parameter and payload before executing database queries.

---

## 📄 License
Created as part of the **CodeAlpha Full Stack Development Internship**. Released under the MIT License.
