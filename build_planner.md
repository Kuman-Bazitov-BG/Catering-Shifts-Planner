# Catering Shifts Planner — Build Planner

> Step-by-step build plan. Updated incrementally as the project progresses.

---

## Project Overview

A software product for catering businesses to plan and organize shifts.  
The app is organized around **groups**, each with their own schedule of shifts that members can join, leave, and comment on.

---

## Tech Stack

| Layer      | Technologies                                      |
|------------|---------------------------------------------------|
| Back-end   | TypeScript · Next.js (API Routes) · Drizzle ORM · PostgreSQL |
| Front-end  | TypeScript · Next.js · React · Tailwind CSS       |
| Mobile     | React Native · Expo                               |

---

## Roles & Permissions

| Role           | Capabilities |
|----------------|--------------|
| **Visitor**    | View home page, register (email + password) |
| **User**       | Manage own profile, create group, join group by invitation |
| **Group Member** | View group shifts, join / leave a shift, comment on shift, share shift link |
| **Group Manager** | Create and manage schedules, invite members to group |
| **Admin** *(optional)* | View and manage all users and groups |

---

## Domain Model

### User
- `id`, `name`, `email`, `passwordHash`, `photo?`, `role`

### Group
- `id`, `name`, `description?`, `createdBy` (userId → auto-assigned as manager)
- Relations: managers (1+), members (0+)

### GroupInvite
- `id`, `groupId`, `token` (unique link), `expiresAt?`, `usedBy?`

### Shift
- `id`, `groupId`, `title`, `date`, `startTime`, `endTime`, `location?`, `createdBy`
- Relations: participants (members who joined), comments

### ShiftParticipant
- `shiftId`, `userId`, `joinedAt`

### Comment
- `id`, `shiftId`, `userId`, `body`, `createdAt`

---

## Build Steps

### Step 1 — Project Setup *(current)*
- [x] Initialize Vite + React + TypeScript (front-end scaffold)
- [ ] Initialize Next.js project (back-end + SSR front-end)
- [ ] Configure Tailwind CSS
- [ ] Set up PostgreSQL + Drizzle ORM
- [ ] Define Drizzle schema (users, groups, shifts, comments)
- [ ] Run first migration

### Step 2 — Authentication
- [ ] Register endpoint (email + password, bcrypt hash)
- [ ] Login endpoint (JWT or NextAuth session)
- [ ] Logout
- [ ] Auth middleware / session guard
- [ ] Protected route wrapper (front-end)

### Step 3 — User Profile
- [ ] View own profile page
- [ ] Edit name + photo
- [ ] Change password

### Step 4 — Groups
- [ ] Create group (user becomes manager automatically)
- [ ] Generate invite link (unique token)
- [ ] Accept invite → join group as member
- [ ] View group details + member list
- [ ] Manager: remove member / transfer manager role

### Step 5 — Shifts / Schedule
- [ ] Manager: create shift (title, date, start/end time, location)
- [ ] Manager: edit / delete shift
- [ ] Member: view shifts in group
- [ ] Member: join / leave shift
- [ ] Share shift link

### Step 6 — Comments
- [ ] Post comment on a shift
- [ ] Delete own comment
- [ ] Manager: delete any comment

### Step 7 — Admin Panel *(optional)*
- [ ] List all users
- [ ] Ban / unban user
- [ ] List all groups
- [ ] Delete group

### Step 8 — Mobile App (React Native + Expo)
- [ ] Expo project init
- [ ] Shared API client (reuse back-end endpoints)
- [ ] Auth screens (login / register)
- [ ] Groups & shifts screens
- [ ] Join / leave / comment on shifts

### Step 9 — Polish & Deploy
- [ ] Input validation (zod)
- [ ] Error handling & toasts
- [ ] Responsive Tailwind UI
- [ ] Deploy back-end (Vercel / Railway)
- [ ] Deploy mobile (Expo EAS)

---

## Notes
- Invite-only group joining: no public group search, only via link.
- Managers are regular users who created or were promoted within a group.
- Mobile app consumes the same REST/tRPC API as the web front-end.
