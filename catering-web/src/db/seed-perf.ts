// Performance-test seed: generates a large dataset to exercise paging, indexes,
// and UI rendering at scale. Run with `npm run db:seed:perf`.
//
//   - 500 groups (first 3 are "mega" groups with heavy shift/member volume)
//   - 5,000 shifts split across the first 3 groups (~1,667 each)
//   - 3,000 bartender/waiter users, plus the usual named/numbered test accounts
//
// This REPLACES all existing data (same destructive reset as `seed.ts`).

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

const BULK_USER_COUNT = 3000;
const GROUP_COUNT = 500;
const BIG_GROUP_COUNT = 3;
const SHIFT_COUNT = 5000;
const BIG_GROUP_MEMBER_COUNT = 500; // distinct bulk users seeded into each mega group
const SMALL_GROUP_MEMBER_COUNT = 4; // members per ordinary small group
const STEVE_EXTRA_GROUPS = 150; // extra groups Steve joins, to stress the groups list page
const MEGA_SHIFT_JOIN_COUNT = 300; // staff on the single "mega" shift
const MEGA_SHIFT_COMMENT_COUNT = 150; // comments on the single "mega" shift

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type Row = Record<string, unknown>;

// The Neon HTTP driver has request-size/time limits, so large batches must be
// chunked into multiple round trips.
async function insertChunked<T extends Row>(
  table: Parameters<typeof db.insert>[0],
  rows: T[],
  label: string,
  chunkSize = 500,
): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await db.insert(table).values(chunk as never);
    process.stdout.write(`\r  ${label}: ${Math.min(i + chunkSize, rows.length)} / ${rows.length}`);
  }
  process.stdout.write("\n");
}

async function insertChunkedReturning<T extends Row, R>(
  table: Parameters<typeof db.insert>[0],
  rows: T[],
  label: string,
  chunkSize: number,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const inserted = (await db.insert(table).values(chunk as never).returning()) as R[];
    out.push(...inserted);
    process.stdout.write(`\r  ${label}: ${out.length} / ${rows.length}`);
  }
  process.stdout.write("\n");
  return out;
}

function pick<T>(arr: T[], n: number, offset = 0): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[(offset + i) % arr.length]);
  return out;
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
  console.log("Cleared existing data.\n");

  // ── Baseline named/numbered users (kept so existing logins keep working) ─
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

  const insertedNamed = await db
    .insert(users)
    .values([...namedUsers, ...numberedUsers].map((u) => ({ ...u, passwordHash })))
    .returning();
  const byEmail = Object.fromEntries(insertedNamed.map((u) => [u.email, u]));
  const steve = byEmail["steve@gmail.com"];
  const peter = byEmail["peter@gmail.com"];
  const dave = byEmail["dave@gmail.com"];
  console.log(`Inserted ${insertedNamed.length} baseline users.`);

  // ── Bulk bartenders & waiters ─────────────────────────────────────────────
  const bulkUserRows = Array.from({ length: BULK_USER_COUNT }, (_, i) => {
    const isBartender = i % 2 === 0;
    const n = Math.floor(i / 2) + 1;
    const role = isBartender ? "Bartender" : "Waiter";
    return { email: `${role.toLowerCase()}${n}@example.com`, name: `${role} ${n}`, passwordHash };
  });
  const insertedBulk = await insertChunkedReturning<typeof bulkUserRows[number], typeof insertedNamed[number]>(
    users,
    bulkUserRows,
    "Bartender/waiter users",
    500,
  );
  console.log(`Inserted ${insertedBulk.length} bartender/waiter users.\n`);

  // ── Groups: first 3 are "mega" groups, the rest are small ────────────────
  const groupRows = [
    { title: "City Catering Team", description: "Flagship crew for the busiest city venues — high shift volume.", createdBy: steve.id },
    { title: "Riverside Banquet Crew", description: "Riverside venues and large banquets — high shift volume.", createdBy: steve.id },
    { title: "Arena Events Squad", description: "Arena and conference catering specialists — high shift volume.", createdBy: steve.id },
    ...Array.from({ length: GROUP_COUNT - BIG_GROUP_COUNT }, (_, i) => ({
      title: `Catering Group ${i + 4}`,
      description: `Regional catering crew #${i + 4}.`,
      createdBy: steve.id,
    })),
  ];
  const insertedGroups = await insertChunkedReturning<typeof groupRows[number], typeof insertedNamed[number] & { title: string; description: string | null; createdBy: number }>(
    groups,
    groupRows,
    "Groups",
    200,
  );
  const [bigGroupA, bigGroupB, bigGroupC, ...smallGroups] = insertedGroups;
  const bigGroups = [bigGroupA, bigGroupB, bigGroupC];
  console.log(`Inserted ${insertedGroups.length} groups (3 mega + ${smallGroups.length} small).\n`);

  // ── Group members ─────────────────────────────────────────────────────────
  const memberRows: { groupId: number; userId: number; isManager: boolean }[] = [];

  // Mega groups: Steve manages all three; Peter/Dave co-manage; ~500 distinct
  // bulk users join each as plain members (offset slices keep them distinct-ish).
  bigGroups.forEach((group, gi) => {
    memberRows.push({ groupId: group.id, userId: steve.id, isManager: true });
    memberRows.push({ groupId: group.id, userId: peter.id, isManager: true });
    memberRows.push({ groupId: group.id, userId: dave.id, isManager: false });
    const slice = pick(insertedBulk, BIG_GROUP_MEMBER_COUNT, gi * BIG_GROUP_MEMBER_COUNT);
    slice.forEach((u, i) =>
      memberRows.push({ groupId: group.id, userId: u.id, isManager: i === 0 }),
    );
  });

  // Small groups: each gets one manager + a handful of members, cycling
  // through the bulk user pool so membership is spread across all of them.
  smallGroups.forEach((group, gi) => {
    const slice = pick(insertedBulk, SMALL_GROUP_MEMBER_COUNT, gi * SMALL_GROUP_MEMBER_COUNT);
    slice.forEach((u, i) =>
      memberRows.push({ groupId: group.id, userId: u.id, isManager: i === 0 }),
    );
  });

  // Steve also joins a batch of small groups as a plain member, so his
  // "/groups" list page has enough rows to need pagination too.
  pick(smallGroups, STEVE_EXTRA_GROUPS, 0).forEach((group) =>
    memberRows.push({ groupId: group.id, userId: steve.id, isManager: false }),
  );

  await insertChunked(groupMembers, memberRows, "Group members", 1000);
  console.log(`Inserted ${memberRows.length} group memberships.\n`);

  // ── Shifts: 5,000 split across the 3 mega groups ─────────────────────────
  const perGroup = Math.ceil(SHIFT_COUNT / BIG_GROUP_COUNT);
  const shiftRows: {
    groupId: number;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    capacity: number;
    canceled: boolean;
    createdBy: number;
  }[] = [];
  const venues = ["Grand Hall", "Riverside Venue", "Arena 111", "Skyline Terrace", "Garden Pavilion"];
  const slots = [
    { start: "08:00:00", end: "12:00:00" },
    { start: "12:00:00", end: "17:00:00" },
    { start: "17:00:00", end: "22:00:00" },
    { start: "18:00:00", end: "23:30:00" },
  ];
  bigGroups.forEach((group, gi) => {
    for (let i = 0; i < perGroup && shiftRows.length < SHIFT_COUNT; i++) {
      const dayOffset = (i % 121) - 60; // spread across ~60 days past .. 60 days future
      const slot = slots[i % slots.length];
      shiftRows.push({
        groupId: group.id,
        title: `${venues[i % venues.length]} Service #${i + 1}`,
        date: addDays(now, dayOffset),
        startTime: slot.start,
        endTime: slot.end,
        location: venues[(i + gi) % venues.length],
        capacity: i === 0 && gi === 0 ? 400 : 20 + (i % 60),
        canceled: i % 37 === 0,
        createdBy: steve.id,
      });
    }
  });
  const insertedShifts = await insertChunkedReturning<typeof shiftRows[number], typeof shiftRows[number] & { id: number }>(
    shifts,
    shiftRows,
    "Shifts",
    500,
  );
  console.log(`Inserted ${insertedShifts.length} shifts.\n`);

  // ── Shift joins & comments ────────────────────────────────────────────────
  // Every shift gets a small, realistic number of joins/comments; the very
  // first shift of the first mega group gets a deliberately huge crowd so the
  // shift-detail page can be tested with hundreds of staff/comments.
  const joinRows: { shiftId: number; userId: number; extraSlots: number }[] = [];
  const commentRows: { shiftId: number; userId: number; body: string }[] = [];
  const commentBodies = [
    "Looking forward to this one!",
    "Does anyone know the dress code?",
    "I can cover the bar section if needed.",
    "Arriving 20 minutes early to help with setup.",
    "Great teamwork on the last event, let's keep it up.",
    "Can someone confirm the parking situation?",
    "I'll bring extra trays just in case.",
    "Who's handling the dessert station this time?",
  ];

  insertedShifts.forEach((shift, si) => {
    const isMega = si === 0;
    const joinCount = isMega ? MEGA_SHIFT_JOIN_COUNT : si % 7;
    const commentCount = isMega ? MEGA_SHIFT_COMMENT_COUNT : si % 4;

    pick(insertedBulk, joinCount, si * 3).forEach((u, i) =>
      joinRows.push({ shiftId: shift.id, userId: u.id, extraSlots: i % 4 === 0 ? 1 : 0 }),
    );
    pick(insertedBulk, commentCount, si * 5).forEach((u, i) =>
      commentRows.push({
        shiftId: shift.id,
        userId: u.id,
        body: commentBodies[(si + i) % commentBodies.length],
      }),
    );
  });

  await insertChunked(shiftJoins, joinRows, "Shift joins", 1000);
  console.log(`Inserted ${joinRows.length} shift joins.`);
  await insertChunked(shiftComments, commentRows, "Shift comments", 1000);
  console.log(`Inserted ${commentRows.length} shift comments.`);

  console.log("\nPerformance seed complete!");
  console.log(`  Mega shift for staff/comment stress-testing: shift id ${insertedShifts[0].id} ("${insertedShifts[0].title}")`);
}

seed().catch((err) => {
  console.error("Performance seed failed:", err);
  process.exit(1);
});
