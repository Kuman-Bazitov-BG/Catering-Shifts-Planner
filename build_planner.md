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

| Layer | Technologies |
|-------|--------------|
| **Back-end** | TypeScript · Next.js (Server Actions + REST API) · Drizzle ORM · Neon serverless PostgreSQL |
| **Front-end** | TypeScript · Next.js · React · Tailwind CSS |
| **Mobile** | React Native · Expo · Expo Router |
| **Auth** | bcrypt/argon2 password hashing · JWT tokens (cookies for web, Bearer header for mobile) |
| **Storage** | Cloudflare R2 (photos / files, if needed) |
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
  - `current` — within the active window (1 h after start time)
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
- `id` (int), `groupId`, `token` (unique invite code), `usedAt?`, `usedBy?` (userId)

### Shift
- `id` (int), `groupId`, `title`, `date`, `startTime`, `endTime`, `location?`, `capacity` (int, default 50), `canceled` (boolean, default false), `createdBy`
- **Computed state** (derived at query time, not stored):
  - `upcoming` → now < startTime
  - `current` → startTime ≤ now ≤ startTime + 1 h
  - `past` → now > startTime + 1 h
  - `full` → participants.length ≥ capacity
- Relations: ShiftJoin (participants), ShiftComment

### ShiftJoin
- `id` (int), `shiftId`, `userId`, `extraSlots` (0–3, default 0), `joinedAt`

### ShiftComment
- `id` (int), `shiftId`, `userId`, `body`, `createdAt`, `editedAt?`
- Editable / deletable by owner or group manager

---

## Build Steps

---

### PHASE 1 — Foundation

#### Step 1 — Monorepo Setup *(current)*
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

#### Step 2 — AGENTS.md + README
- [ ] `AGENTS.md` at root (project overview, folder structure, tech stack)
- [ ] `catering-web/AGENTS.md` (Next.js guidelines: service layer, auth, DB, UI)
- [ ] `catering-mobile/AGENTS.md` (Expo guidelines: REST API, Bearer auth, mobile UI, alert fallbacks; add API docs URL: `http://localhost:3000/api/docs`)
- [ ] `README.md` at root (project description, demo credentials, setup guide, folder map, DB schema diagram)

#### Step 3 — Database Setup
- [ ] Create Neon DB project (`CateringDB`)
- [ ] Configure `DATABASE_URL` + `JWT_SECRET` (random) in `.env`
- [ ] Install: `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`, `dotenv`, `bcrypt`/`argon2`
- [ ] Define Drizzle schema (`src/db/schema.ts`): users, groups, groupMembers, groupInvites, shifts, shiftJoins, shiftComments
- [ ] Use simple integer IDs for all tables
- [ ] `npm run db:generate` → generate migration
- [ ] `npm run db:migrate` → apply migration to Neon DB
- [ ] Commit & push

#### Step 4 — Seed Sample Data
- [ ] Create `npm run db:seed` script
- [ ] Seed users: `steve`, `peter`, `dave`, `john`, `nick`, `user1`–`user9` (all `pass123`)
- [ ] Seed groups: *City Catering Team* (manager: steve) · *Weekend Events Crew* (managers: steve, peter)
- [ ] Seed shifts:
  - today +3 d → City Catering Team · The Grand Hall · capacity 100 (upcoming)
  - today +5 d → City Catering Team · Riverside Venue · capacity 80 (upcoming)
  - today +6 d → Weekend Events Crew · Arena 111 · capacity 60 (upcoming)
  - today −20 d → City Catering Team · Riverside Venue · capacity 40 (past)
  - today −30 d → Weekend Events Crew · Arena 111 · capacity 20 (past)
- [ ] Seed shift joins (≈ half of each group's members, mix of bartenders/waiters, with extraSlots)
- [ ] Seed shift comments (meaningful messages per shift)
- [ ] Run `db:seed` and verify data in Neon console
- [ ] Commit & push

---

### PHASE 2 — Web App Core

#### Step 5 — Public Pages & Layout
- [ ] Home page: welcome note + Login / Register buttons
- [ ] Login page — server-rendered page at `(auth)/login`, interactive form as client component
- [ ] Register page — server-rendered page at `(auth)/register`, interactive form as client component
- [ ] App layout: header · main · footer
- [ ] Header: show `[Login] | [Register]` when not logged in; show user info + `[Logout]` when logged in
- [ ] Header: show `[Dashboard]` + `[Groups]` links for logged-in users
- [ ] Responsive header layout (mobile / tablet)
- [ ] Commit & push

#### Step 6 — Authentication
- [ ] Server Action: register (email + password → hash with bcrypt, store user)
- [ ] Server Action: login (verify password → issue JWT stored in HTTP-only cookie)
- [ ] Server Action: logout (clear cookie)
- [ ] Next.js middleware to protect all routes except `/`, `(auth)/login`, `(auth)/register`
- [ ] After login → redirect to `/dashboard` (not home page)
- [ ] `JWT_SECRET` generated randomly in `.env`
- [ ] REST `Authorization: Bearer <token>` support for mobile API
- [ ] Commit & push

#### Step 7 — User Profile
- [ ] View own profile page (`/profile`)
- [ ] Edit name + photo (upload to Cloudflare R2 if needed)
- [ ] Change password

---

### PHASE 3 — Staff Dashboard & Shifts

#### Step 8 — Staff Dashboard (`/dashboard`)
- [ ] **Active Shifts section** (main): all upcoming + current + not-canceled shifts across user's groups
  - Display as cards: date, location, group name, state badge, staff count, comment count
  - Order by date (soonest first)
  - Clicking a card → `/shifts/[id]`
- [ ] **Archive Shifts section** (secondary): past + canceled shifts, ordered by date
- [ ] Always show shift state badge: `upcoming` / `current` / `past` / `canceled` / `full` / `under capacity` / `over capacity`
- [ ] Shift is `current` for 1 hour after start time
- [ ] `[Dashboard]` link in header for logged-in users
- [ ] Commit & push

#### Step 9 — View / Join Shift (`/shifts/[id]`)
- [ ] Page available only to group members of the shift's group; show error if not a member
- [ ] Display full shift info: date, location, state, capacity, staff joined, comments
- [ ] `[Join]` / `[Leave]` buttons (active only when shift is upcoming or current and not canceled)
- [ ] When joined: reserve / edit extra slots (+1 / −1, range 0–3)
- [ ] Update shift state + staff list after join / leave / slot change (no page reload)
- [ ] "Share shift link" — copy shareable URL to clipboard
- [ ] Server-side paging for participant list and comments
- [ ] Commit & push

#### Step 10 — Shift Comments
- [ ] Member: post comment on a shift
- [ ] Member: edit own comment
- [ ] Member: delete own comment
- [ ] Manager: edit / delete any comment
- [ ] Comments listed chronologically on the shift screen
- [ ] Commit & push

---

### PHASE 4 — Minimalistic REST API (for Mobile)

#### Step 11 — RESTful API
- [x] `POST /api/auth/login` — login by email + password → return JWT token
- [x] `GET /api/shifts` — list active shifts (open for joining), JWT auth, with server-side paging
- [x] `GET /api/shifts/[id]` — shift details (date, location, state, capacity, isJoined, staff joined, comments)
- [x] `POST /api/shifts/[id]/join` — join a shift (if not joined)
- [x] `POST /api/shifts/[id]/leave` — leave a shift (if joined)
- [x] `POST /api/shifts/[id]/slots` — reserve additional slots (0, 1, or more)
- [x] `GET /api/docs` — API documentation as HTML page
- [x] Fix CORS policy if needed (for Expo client)
- [ ] Commit & push

---

### PHASE 5 — Expo Mobile App

#### Step 12 — Mobile: Setup & Home Screen
- [ ] Empty Expo project: remove all template pages, styles, themes, color schemes, components, hooks
- [ ] Create empty screens: Home · Login · Shifts · Shift Details
- [ ] Implement stack navigation (Expo Router)
- [ ] Home screen: welcome message + login link
- [ ] Configure `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api` in `.env`
- [ ] Add API docs URL to `catering-mobile/AGENTS.md`
- [ ] Commit & push

#### Step 13 — Mobile: Login / Logout
- [ ] Login form with error handling (calls `POST /api/auth/login`)
- [ ] Store JWT token (secure storage)
- [ ] `[Logout]` button on home screen (clear token)
- [ ] All screens except Home and Login require logged-in user; redirect to Login if not
- [ ] Commit & push

#### Step 14 — Mobile: Shifts Dashboard
- [ ] List active shifts with server-side paging (calls `GET /api/shifts`)
- [ ] Display as clickable cards
- [ ] Commit & push

#### Step 15 — Mobile: Shift Details
- [ ] Display full shift info (calls `GET /api/shifts/[id]`)
- [ ] `[Join]` / `[Leave]` buttons
- [ ] Reserve / edit extra slots (+1 / −1)
- [ ] Update shift state after join / leave / slot change
- [ ] Commit & push

---

### PHASE 6 — Deployment

#### Step 16 — Deploy Next.js to Netlify
- [ ] Configure environment variables on Netlify (`DATABASE_URL`, `JWT_SECRET`, etc.)
- [ ] Deploy `catering-web` from GitHub to Netlify
- [ ] Verify all routes and API endpoints work on live URL
- [ ] Note the exposed RESTful API base URL

#### Step 17 — Deploy Expo to Netlify
- [ ] Expo Web export build
- [ ] Configure `EXPO_PUBLIC_API_BASE_URL` to production Next.js URL
- [ ] Deploy `catering-mobile` (web export) to Netlify
- [ ] Add sample credentials (`demo / demo123`) to README
- [ ] Optionally: build Android APK via Expo EAS → publish to GitHub Releases

---

### PHASE 7 — Advanced Web App Features

#### Step 18 — Dashboard Paging
- [ ] Server-side paging for shifts in `/dashboard` (prevent UI freezing for large datasets)

#### Step 19 — View Groups (`/groups/`, `/groups/[id]`)
- [ ] `/groups/` — list user's groups; `[Groups]` link in header for logged-in users
- [ ] `/groups/[id]` — group details (info, managers, members, shifts); members-only access
- [ ] Commit & push

#### Step 20 — Manage Groups
- [ ] `/groups/` — `[New]` button + `[Edit]` / `[Delete]` buttons for managers
- [ ] `/groups/new` — create a new group (creator becomes manager)
- [ ] `/groups/[id]/edit` — edit group (managers only)
- [ ] `/groups/[id]/delete` — delete group with confirm/cancel (managers only)
- [ ] Server-rendered pages + Server Actions + client forms
- [ ] Commit & push

#### Step 21 — Create / Edit Shift (from Group)
- [ ] `/groups/[id]` — show `[Create Shift]` / `[Edit]` / `[Delete]` links for managers
- [ ] `/groups/[id]/shifts/new` — create shift (managers only)
- [ ] `/groups/[id]/shifts/[id]/edit` — edit / cancel shift (managers only)
- [ ] `/groups/[id]/shifts/[id]/delete` — delete shift with confirm/cancel (managers only)
- [ ] Commit & push

#### Step 22 — Invite to Group
- [ ] `[Create Invite Link]` on group details page (managers only)
- [ ] Invite link format: `/groups/[id]/join?code=…`
- [ ] Invite codes: one-time use, valid for one person
- [ ] DB migration: add `GroupInvite` table (groupId, inviteCode, usedAt?, usedBy?)
- [ ] Accept Invite page `/groups/[id]/join?code=…`:
  - Valid link + logged-in → join group, show welcome message + group link
  - Invalid / already used → show specific error
  - Not logged in → redirect to `/login?redirect=<invite-url>`
- [ ] Login page: support `?redirect=` param → redirect back after login
- [ ] Commit & push

#### Step 23 — Leave a Group
- [ ] "Leave Group" button on group details page for members
- [ ] Commit & push

#### Step 24 — Manage Group Members
- [ ] `/groups/[id]/members` — view members, remove members, promote/demote managers
- [ ] Commit & push

---

### PHASE 8 — Advanced Mobile Features

#### Step 25 — Mobile: Comments on Shifts
- [ ] Extend REST API: `GET /api/shifts/[id]/comments`, `POST`, `PUT /api/shifts/[id]/comments/[id]`, `DELETE`
- [ ] Implement comments view + add / edit / delete in Shift Details screen

#### Step 26 — Mobile: Registration
- [ ] Extend REST API: `POST /api/auth/register`
- [ ] Add Register screen to mobile app

---

### PHASE 9 — Performance

#### Step 27 — Performance Test & Optimization
- [ ] Seed 500 groups, 5 000 shifts (in first 3 groups), 3 000 users
- [ ] Test UI for slow/hanging screens
- [ ] Add DB indexes (emails, foreign keys, date columns)
- [ ] Implement paging where missing
- [ ] Profile and fix bottlenecks
- [ ] Commit & push

---

## Notes
- Invite-only group joining: no public group search, only via invite link.
- Managers are regular users who created or were promoted within a group.
- Mobile app consumes the same REST API as the web back-end (no separate back-end).
- Use simple integer IDs (not UUIDs) for all DB tables per project requirements.
- `JWT_SECRET` must be a random key stored in `.env` (never committed).
- All native mobile dialogs (alert, confirm) need a Web modal fallback for Expo Web.
- Shift `current` window = 1 hour after start time (not 8–12 h as initially noted).
