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
  (t) => [primaryKey({ columns: [t.groupId, t.userId] })],
);

export const groupInvites = pgTable("group_invites", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .notNull()
    .references(() => groups.id),
  token: varchar("token", { length: 255 }).notNull().unique(),
  usedAt: timestamp("used_at"),
  usedBy: integer("used_by").references(() => users.id),
});

export const shifts = pgTable("shifts", {
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
});

export const shiftJoins = pgTable("shift_joins", {
  id: serial("id").primaryKey(),
  shiftId: integer("shift_id")
    .notNull()
    .references(() => shifts.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  extraSlots: integer("extra_slots").notNull().default(0),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const shiftComments = pgTable("shift_comments", {
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
});
