import { config } from "dotenv";
config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hashSync } from "bcryptjs";
import {
  users,
  groups,
  groupMembers,
  shifts,
  shiftJoins,
  shiftComments,
} from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function seed() {
  const now = new Date();
  const passwordHash = hashSync("pass123", 10);

  // ── Clear existing data (reverse FK order) ──────────────────────────────
  await db.delete(shiftComments);
  await db.delete(shiftJoins);
  await db.delete(shifts);
  await db.delete(groupMembers);
  await db.delete(groups);
  await db.delete(users);
  console.log("Cleared existing data.");

  // ── Users ────────────────────────────────────────────────────────────────
  const namedUsers = [
    { email: "steve@gmail.com", name: "Steve" },
    { email: "peter@gmail.com", name: "Peter" },
    { email: "dave@gmail.com", name: "Dave" },
    { email: "john@gmail.com", name: "John" },
    { email: "nick@gmail.com", name: "Nick" },
  ];
  const numberedUsers = Array.from({ length: 9 }, (_, i) => ({
    email: `user${i + 1}@gmail.com`,
    name: `User${i + 1}`,
  }));

  const insertedUsers = await db
    .insert(users)
    .values([...namedUsers, ...numberedUsers].map((u) => ({ ...u, passwordHash })))
    .returning();

  const byEmail = Object.fromEntries(insertedUsers.map((u) => [u.email, u]));
  const steve = byEmail["steve@gmail.com"];
  const peter = byEmail["peter@gmail.com"];
  const dave = byEmail["dave@gmail.com"];
  const john = byEmail["john@gmail.com"];
  const nick = byEmail["nick@gmail.com"];
  const u = (n: number) => byEmail[`user${n}@gmail.com`];
  console.log(`Inserted ${insertedUsers.length} users.`);

  // ── Groups ───────────────────────────────────────────────────────────────
  const [cityTeam, weekendCrew] = await db
    .insert(groups)
    .values([
      {
        title: "City Catering Team",
        description: "Professional catering crew for city events",
        createdBy: steve.id,
      },
      {
        title: "Weekend Events Crew",
        description: "Weekend event specialists for private and corporate events",
        createdBy: steve.id,
      },
    ])
    .returning();
  console.log("Inserted 2 groups.");

  // ── Group Members ─────────────────────────────────────────────────────────
  // City Catering Team: manager = steve; members = dave, nick, user1–user9
  const cityMembers = [
    { groupId: cityTeam.id, userId: steve.id, isManager: true },
    { groupId: cityTeam.id, userId: dave.id, isManager: false },
    { groupId: cityTeam.id, userId: nick.id, isManager: false },
    ...Array.from({ length: 9 }, (_, i) => ({
      groupId: cityTeam.id,
      userId: u(i + 1).id,
      isManager: false,
    })),
  ];

  // Weekend Events Crew: managers = steve, peter; members = john, user1–user9
  const weekendMembers = [
    { groupId: weekendCrew.id, userId: steve.id, isManager: true },
    { groupId: weekendCrew.id, userId: peter.id, isManager: true },
    { groupId: weekendCrew.id, userId: john.id, isManager: false },
    ...Array.from({ length: 9 }, (_, i) => ({
      groupId: weekendCrew.id,
      userId: u(i + 1).id,
      isManager: false,
    })),
  ];

  await db.insert(groupMembers).values([...cityMembers, ...weekendMembers]);
  console.log("Inserted 24 group members.");

  // ── Shifts ────────────────────────────────────────────────────────────────
  const insertedShifts = await db
    .insert(shifts)
    .values([
      {
        groupId: cityTeam.id,
        title: "Grand Hall Evening Service",
        date: addDays(now, 3),
        startTime: "18:00:00",
        endTime: "23:00:00",
        location: "The Grand Hall",
        capacity: 12,
        canceled: false,
        createdBy: steve.id,
      },
      {
        groupId: cityTeam.id,
        title: "Riverside Gala Dinner",
        date: addDays(now, 5),
        startTime: "19:00:00",
        endTime: "23:59:00",
        location: "Riverside Venue",
        capacity: 12,
        canceled: false,
        createdBy: steve.id,
      },
      {
        groupId: weekendCrew.id,
        title: "Arena 111 Conference Catering",
        date: addDays(now, 6),
        startTime: "17:00:00",
        endTime: "22:00:00",
        location: "Arena 111",
        capacity: 10,
        canceled: false,
        createdBy: steve.id,
      },
      {
        groupId: cityTeam.id,
        title: "Riverside Anniversary Banquet",
        date: addDays(now, -20),
        startTime: "18:00:00",
        endTime: "23:00:00",
        location: "Riverside Venue",
        capacity: 12,
        canceled: false,
        createdBy: steve.id,
      },
      {
        groupId: weekendCrew.id,
        title: "Arena 111 Corporate Event",
        date: addDays(now, -30),
        startTime: "19:00:00",
        endTime: "23:59:00",
        location: "Arena 111",
        capacity: 12,
        canceled: false,
        createdBy: steve.id,
      },
    ])
    .returning();

  const [shift1, shift2, shift3, shift4, shift5] = insertedShifts;
  console.log("Inserted 5 shifts.");

  // ── Shift Joins ───────────────────────────────────────────────────────────
  await db.insert(shiftJoins).values([
    // Shift 1 — Grand Hall (City Catering Team, upcoming)
    { shiftId: shift1.id, userId: steve.id, extraSlots: 0 },
    { shiftId: shift1.id, userId: dave.id, extraSlots: 1 },
    { shiftId: shift1.id, userId: u(1).id, extraSlots: 0 },
    { shiftId: shift1.id, userId: u(3).id, extraSlots: 0 },
    { shiftId: shift1.id, userId: u(5).id, extraSlots: 1 },
    { shiftId: shift1.id, userId: u(7).id, extraSlots: 0 },
    // Shift 2 — Riverside (City Catering Team, upcoming)
    { shiftId: shift2.id, userId: nick.id, extraSlots: 0 },
    { shiftId: shift2.id, userId: u(2).id, extraSlots: 0 },
    { shiftId: shift2.id, userId: u(4).id, extraSlots: 2 },
    { shiftId: shift2.id, userId: u(6).id, extraSlots: 0 },
    { shiftId: shift2.id, userId: u(8).id, extraSlots: 0 },
    { shiftId: shift2.id, userId: u(9).id, extraSlots: 1 },
    // Shift 3 — Arena 111 (Weekend Events Crew, upcoming)
    { shiftId: shift3.id, userId: peter.id, extraSlots: 0 },
    { shiftId: shift3.id, userId: john.id, extraSlots: 1 },
    { shiftId: shift3.id, userId: u(1).id, extraSlots: 0 },
    { shiftId: shift3.id, userId: u(4).id, extraSlots: 0 },
    { shiftId: shift3.id, userId: u(7).id, extraSlots: 2 },
    { shiftId: shift3.id, userId: u(9).id, extraSlots: 0 },
    // Shift 4 — Riverside Anniversary (City Catering Team, past)
    { shiftId: shift4.id, userId: steve.id, extraSlots: 0 },
    { shiftId: shift4.id, userId: dave.id, extraSlots: 0 },
    { shiftId: shift4.id, userId: nick.id, extraSlots: 1 },
    { shiftId: shift4.id, userId: u(1).id, extraSlots: 0 },
    { shiftId: shift4.id, userId: u(2).id, extraSlots: 0 },
    { shiftId: shift4.id, userId: u(3).id, extraSlots: 0 },
    // Shift 5 — Arena 111 Corporate (Weekend Events Crew, past)
    { shiftId: shift5.id, userId: steve.id, extraSlots: 0 },
    { shiftId: shift5.id, userId: peter.id, extraSlots: 0 },
    { shiftId: shift5.id, userId: u(2).id, extraSlots: 1 },
    { shiftId: shift5.id, userId: u(5).id, extraSlots: 0 },
    { shiftId: shift5.id, userId: u(6).id, extraSlots: 0 },
    { shiftId: shift5.id, userId: u(8).id, extraSlots: 2 },
  ]);
  console.log("Inserted 30 shift joins.");

  // ── Shift Comments ────────────────────────────────────────────────────────
  await db.insert(shiftComments).values([
    // Shift 1 — Grand Hall (upcoming)
    { shiftId: shift1.id, userId: steve.id, body: "I'll be there 30 minutes early to help with setup." },
    { shiftId: shift1.id, userId: dave.id, body: "Does anyone know the dress code for this event?" },
    { shiftId: shift1.id, userId: u(1).id, body: "Looking forward to it — The Grand Hall is a great venue." },
    // Shift 2 — Riverside (upcoming)
    { shiftId: shift2.id, userId: nick.id, body: "Who else is working the bar section?" },
    { shiftId: shift2.id, userId: u(4).id, body: "Arriving on time, parking at the west lot." },
    { shiftId: shift2.id, userId: u(2).id, body: "I can cover the dessert station if needed." },
    // Shift 3 — Arena 111 (upcoming)
    { shiftId: shift3.id, userId: peter.id, body: "Big event this one — let's make sure we're all coordinated." },
    { shiftId: shift3.id, userId: john.id, body: "I'll bring extra serving trays just in case." },
    { shiftId: shift3.id, userId: u(7).id, body: "Can anyone share the parking info for Arena 111?" },
    // Shift 4 — Riverside Anniversary (past)
    { shiftId: shift4.id, userId: steve.id, body: "Great teamwork everyone, the event went smoothly!" },
    { shiftId: shift4.id, userId: dave.id, body: "The guests were very pleased with the service." },
    { shiftId: shift4.id, userId: u(3).id, body: "Tough shift but we pulled through. Well done team!" },
    // Shift 5 — Arena 111 Corporate (past)
    { shiftId: shift5.id, userId: peter.id, body: "Professional job by the whole crew tonight." },
    { shiftId: shift5.id, userId: u(5).id, body: "The venue staff were really helpful — made the evening much easier." },
    { shiftId: shift5.id, userId: steve.id, body: "One of our better performances. Good coordination all around." },
  ]);
  console.log("Inserted 15 shift comments.");

  console.log("\nSeed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
