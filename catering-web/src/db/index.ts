import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Shared Drizzle client for the app runtime. Next.js auto-loads .env, so
// DATABASE_URL is available without dotenv here (unlike the standalone seed script).
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
