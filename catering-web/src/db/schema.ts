import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  date,
  time,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  photoUrl: text("photo_url"),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
});

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    isManager: boolean("is_manager").notNull().default(false),
  },
  (t) => [
    primaryKey({ columns: [t.groupId, t.userId] }),
    // Looking up "which groups does this user belong to" (getUserGroups,
    // dashboard/shift-list joins) only has the composite PK to lean on,
    // which is keyed by groupId first — a bare userId index avoids a full scan.
    index("group_members_user_id_idx").on(t.userId),
  ],
);

export const groupInvites = pgTable(
  "group_invites",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id),
    token: varchar("token", { length: 255 }).notNull().unique(),
    usedAt: timestamp("used_at"),
    usedBy: integer("used_by").references(() => users.id),
  },
  (t) => [index("group_invites_group_id_idx").on(t.groupId)],
);

export const shifts = pgTable(
  "shifts",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id),
    title: varchar("title", { length: 255 }).notNull(),
    date: date("date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    location: text("location"),
    capacity: integer("capacity").notNull().default(50),
    canceled: boolean("canceled").notNull().default(false),
    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id),
  },
  (t) => [
    // Group detail / shift-list pages filter by groupId and sort by date+time —
    // a composite index lets Postgres satisfy both in one index scan.
    index("shifts_group_id_date_idx").on(t.groupId, t.date, t.startTime),
    index("shifts_date_idx").on(t.date),
  ],
);

export const shiftJoins = pgTable(
  "shift_joins",
  {
    id: serial("id").primaryKey(),
    shiftId: integer("shift_id")
      .notNull()
      .references(() => shifts.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    extraSlots: integer("extra_slots").notNull().default(0),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (t) => [
    index("shift_joins_shift_id_idx").on(t.shiftId),
    index("shift_joins_user_id_idx").on(t.userId),
  ],
);

export const shiftComments = pgTable(
  "shift_comments",
  {
    id: serial("id").primaryKey(),
    shiftId: integer("shift_id")
      .notNull()
      .references(() => shifts.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    editedAt: timestamp("edited_at"),
  },
  (t) => [index("shift_comments_shift_id_idx").on(t.shiftId, t.createdAt)],
);
