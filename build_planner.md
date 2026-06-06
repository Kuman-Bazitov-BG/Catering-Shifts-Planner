# Catering Shifts Planner — Build Planner

> Step-by-step build plan. Updated incrementally as the project progresses.

---

## Project Overview

A software product for catering businesses to plan and organize shifts.
The app is organized around **groups**, each with their own schedule of shifts that members can join, leave, and comment on.

- **Web app** — primary app, implements full functionality (users, groups, shifts, comments, admin)
- **Mobile app** — scope-limited, implements core member functionality (login/register, view shifts, join/unjoin, comment)

---

## Tech Stack

| Layer        | Technologies |
|--------------|--------------|
| **Back-end** | TypeScript · Next.js (Server Actions + REST API) · Drizzle ORM · Neon serverless PostgreSQL |
| **Front-end** | TypeScript · Next.js · React · Tailwind CSS |
| **Mobile**   | React Native · Expo · Expo Router |
| **Auth**     | bcrypt/argon2 password hashing · JWT tokens (cookies for web, Bearer header for mobile) |
| **Storage**  | Cloudflare R2 (photos / files, if needed) |
| **Deployment** | Netlify (serverless) · Neon DB (serverless PostgreSQL) |

---

## Architecture

- **Client-server:** React frontend ↔ Next.js backend via **Server Actions** (web); Expo mobile ↔ Next.js backend via **RESTful API** (mobile)
- **Monorepo structure:**

```
catering-planner/           ← root monorepo
├── package.json            ← workspace deps + scripts (npm workspaces)
├── AGENTS.md               ← agent instructions for entire project
├── README.md               ← project description
├── catering-web/           ← Next.js web app (back-end + front-end)
│   ├── src/app/            ← Next.js pages & layouts
│   ├── src/app/api/        ← RESTful API endpoints (for mobile)
│   ├── src/services/       ← business logic service layer
│   ├── src/db/             ← Drizzle schema + scripts
│   ├── src/drizzle/        ← Drizzle migrations
│   ├── tests/              ← automated tests (optional)
│   ├── AGENTS.md           ← agent instructions for Next.js app
│   └── package.json
├── catering-mobile/        ← Expo mobile app
│   ├── src/                ← React Native app code
│   ├── tests/              ← automated tests (optional)
│   ├── AGENTS.md           ← agent instructions for Expo app
│   └── package.json
└── catering-shared/        ← shared TypeScript types (User, Shift, Comment, …)
    └── src/
```

- **Service layer:** all business logic in `src/services/`, consumed by both Server Actions and REST route handlers
- **Modular design:** split into UI pages, UI components, services, route handlers, utils — separate files for UI, logic, and assets
- **Server-side paging** to prevent performance issues on large datasets
- **Server components** by default in Next.js; client components only when browser interaction is needed

---

## Roles & Permissions

| Role | Capabilities |
|------|--------------|
| **Visitor** | View home page, register (email + password) |
| **User** | Manage own profile, create group, join group by invitation |
| **Group Member** | View group shifts, join / leave a shift, comment on shift, share shift link |
| **Group Manager** | Create / edit / cancel / delete shifts · Share shift link · Invite users via link · Promote / demote group managers · Remove members |
| **Admin** *(optional)* | View and manage all users and groups |

---

## Group Manager Capabilities

- **Shifts:** create, edit, cancel (`canceled = true`), delete shifts in their group
- **Shift link:** copy a shareable shift URL
- **Invitations:** generate and share a group invite link; users who accept become members
- **Member management:** promote members to manager · demote managers to member · remove members from the group

---

## Group Member Capabilities

- Browse all shifts in their groups, filtered by: **upcoming**, **current**, **past**
- Each shift always displays its computed state badge:
  - `upcoming` — start time not yet reached
  - `current` — within the active window (8–12 h after start time)
  - `past` — active window has ended
  - `canceled` — cancelled by a manager (shown on top of any state)
  - `full` — participant count ≥ capacity
  - `under capacity` — participant count < capacity
  - `over capacity` — participant count > capacity (edge case)
- **Join** a shift when not yet joined (upcoming or current, not canceled)
- **Unjoin** (leave) a shift after joining — optionally leaving a comment on departure
- When joining, allocate **additional slots** (+1 / +2 / +3 — bring a friend)
- Full capacity does **not** block joining — members resolve over-capacity situations themselves
- View the **participant list** for each shift (members currently joined — bartenders and waiters)
- **Post comments** on a shift (e.g. "Coming 10 mins late", "Can I bring a friend?")
- **Edit / delete own comments**
- Share shift link

---

## Domain Model

### User
- `id` (int), `name`, `email`, `passwordHash`, `photoUrl?`

### Group
- `id` (int), `title`, `description?`, `createdBy` (userId → auto-assigned as manager)
- Relations: GroupMember (members + managers), shifts

### GroupMember
- `groupId`, `userId`, `isManager` (boolean)

### GroupInvite
- `id` (int), `groupId`, `token` (unique link), `expiresAt?`, `usedBy?`

### Shift
- `id` (int), `groupId`, `title`, `date`, `startTime`, `endTime`, `location?`, `capacity` (int, default 50), `canceled` (boolean, default false), `createdBy`
- **Computed state** (derived at query time, not stored):
  - `upcoming` → now < startTime
  - `current` → startTime ≤ now ≤ startTime + 8–12 h
  - `past` → now > startTime + active window
  - `full` → participants.length ≥ capacity
- Relations: ShiftJoin (participants), ShiftComment

### ShiftJoin
- `id` (int), `shiftId`, `userId`, `extraSlots` (0–3, default 0), `joinedAt`

### ShiftComment
- `id` (int), `shiftId`, `userId`, `body`, `createdAt`, `editedAt?`
- Editable / deletable by owner or group manager

---

## Build Steps

### Step 1 — Monorepo Setup *(current)*
- [x] Root folder created
- [ ] `npm init` → root `package.json` with npm workspaces
- [ ] `npx create-next-app@latest catering-web` (TypeScript + Tailwind + App Router)
- [ ] `npx create-expo-app@latest catering-mobile`
- [ ] `mkdir catering-shared` → shared TypeScript types
- [ ] Move source code into `src/` folders for each sub-project
- [ ] Root `npm run dev` and `npm run build` scripts wiring both apps
- [ ] Discard nested `.git` repos; initialize single monorepo git at root
- [ ] Configure root `.gitignore`
- [ ] Push monorepo to GitHub

### Step 2 — AGENTS.md + README
- [ ] `AGENTS.md` at root (project overview, folder structure, tech stack)
- [ ] `catering-web/AGENTS.md` (Next.js guidelines: service layer, auth, DB, UI)
- [ ] `catering-mobile/AGENTS.md` (Expo guidelines: REST API, Bearer auth, mobile UI, alert fallbacks)
- [ ] `README.md` at root (project description, demo credentials, setup guide, folder map)

### Step 3 — Database Setup
- [ ] Create Neon DB project (`CateringDB`)
- [ ] Configure `DATABASE_URL` in `.env`
- [ ] Install: `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`, `dotenv`
- [ ] Define Drizzle schema (`src/db/schema.ts`): users, groups, groupMembers, groupInvites, shifts, shiftJoins, shiftComments
- [ ] Use simple integer IDs for all tables
- [ ] `npm run db:generate` → generate migration
- [ ] `npm run db:migrate` → apply migration to Neon DB
- [ ] Commit & push

### Step 4 — Seed Sample Data
- [ ] Create `npm run db:seed` script
- [ ] Seed users: `steve`, `peter`, `dave`, `john`, `nick`, `user1`–`user9` (all `pass123`)
- [ ] Seed groups: *City Catering Team* (manager: steve) · *Weekend Events Crew* (managers: steve, peter)
- [ ] Seed shifts:
  - today +3 d → City Catering Team · The Grand Hall · capacity 12 (upcoming)
  - today +5 d → City Catering Team · Riverside Venue · capacity 12 (upcoming)
  - today +6 d → Weekend Events Crew · Arena 111 · capacity 10 (upcoming)
  - today −20 d → City Catering Team · Riverside Venue · capacity 12 (past)
  - today −30 d → Weekend Events Crew · Arena 111 · capacity 12 (past)
- [ ] Seed shift joins (≈ half of each group's members, mix of bartenders/waiters)
- [ ] Seed shift comments (meaningful messages per shift)
- [ ] Run `db:seed` and verify data in Neon console
- [ ] Commit & push

### Step 5 — Public Pages & Layout
- [ ] Home page: welcome note + login / register buttons
- [ ] Login page (client component, `(auth)` route group)
- [ ] Register page (client component, `(auth)` route group)
- [ ] App layout: header · main · footer
- [ ] Header navigation links + responsive layout (mobile / tablet)
- [ ] Commit & push

### Step 6 — Authentication
- [ ] Register endpoint: email + password, hash with bcrypt/argon2, store user
- [ ] Login endpoint: verify password, issue JWT (stored in HTTP-only cookie for web)
- [ ] Logout: clear cookie / invalidate session
- [ ] Auth middleware / session guard (Next.js middleware)
- [ ] Protected route wrapper (front-end)
- [ ] REST `Authorization: Bearer <token>` support for mobile
- [ ] Commit & push

### Step 7 — User Profile
- [ ] View own profile page
- [ ] Edit name + photo (upload to Cloudflare R2 if photo storage needed)
- [ ] Change password

### Step 8 — Groups
- [ ] Create group (creator auto-assigned as manager)
- [ ] Generate invite link (unique token)
- [ ] Accept invite → join group as member
- [ ] View group details + member list
- [ ] Manager: remove member from group
- [ ] Manager: promote member to manager / demote manager to member
- [ ] Commit & push

### Step 9 — Shifts / Schedule
- [ ] Manager: create shift (title, date, start/end time, location, capacity)
- [ ] Manager: edit shift
- [ ] Manager: cancel shift (`canceled = true`)
- [ ] Manager: delete shift
- [ ] Manager: share shift link (copy shareable URL)
- [ ] Member: browse shifts filtered by upcoming / current / past
- [ ] Member: shift state badge (upcoming / current / past / canceled / full / under / over capacity)
- [ ] Member: join shift with optional extra slots (+1 / +2 / +3)
- [ ] Member: unjoin shift (optionally leave a comment on departure)
- [ ] No capacity hard-block — over-capacity joins are allowed
- [ ] Member: view participant list (bartenders & waiters, with extra slots)
- [ ] Member: share shift link
- [ ] Server-side paging for shift lists
- [ ] Commit & push

### Step 10 — Comments
- [ ] Member: post comment on a shift
- [ ] Member: edit own comment
- [ ] Member: delete own comment
- [ ] Manager: edit / delete any comment
- [ ] Comments listed chronologically on the shift screen
- [ ] Commit & push

### Step 11 — Admin Panel *(optional)*
- [ ] List / manage all users (ban / unban)
- [ ] List / delete all groups

### Step 12 — Mobile App (Expo)
- [ ] Shared REST API client in `catering-shared/` (reuses back-end endpoints)
- [ ] Auth screens: login / register
- [ ] Groups & shifts screens
- [ ] Join / unjoin shift · comment on shift
- [ ] Native alert / confirm dialogs with Web modal fallback
- [ ] Expo Web export build
- [ ] Optionally: Android APK via Expo EAS → publish to GitHub Releases

### Step 13 — Polish & Deploy
- [ ] Input validation with Zod across services and API routes
- [ ] Error handling & toast notifications
- [ ] Responsive Tailwind UI (desktop + mobile browser)
- [ ] Icons, visual cues, UX polish
- [ ] Deploy Next.js app to **Netlify**
- [ ] Deploy Expo app to **Netlify** (web export)
- [ ] Add sample credentials (`demo / demo123`) to README
- [ ] Generate DB schema diagram for README
- [ ] Final commit & push

---

## Notes
- Invite-only group joining: no public group search, only via invite link.
- Managers are regular users who created or were promoted within a group.
- Mobile app consumes the same REST API as the web back-end (no separate back-end).
- Use simple integer IDs (not UUIDs) for all DB tables per project requirements.
- JWT_SECRET must be a random key stored in `.env` (never committed).
- All native mobile dialogs (alert, confirm) need a Web modal fallback for Expo Web.
