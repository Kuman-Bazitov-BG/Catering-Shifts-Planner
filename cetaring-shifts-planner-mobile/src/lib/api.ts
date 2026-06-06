const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

export type ApiUser = { id: number; name: string; email: string };

// ── Auth ────────────────────────────────────────────────────────────────────

export type LoginResult =
  | { ok: true; token: string; user: ApiUser }
  | { ok: false; error: string };

export async function apiLogin(
  email: string,
  password: string,
): Promise<LoginResult> {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? 'Login failed.' };
    return { ok: true, token: data.token, user: data.user };
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your connection.' };
  }
}

// ── Shifts ──────────────────────────────────────────────────────────────────

export type ShiftState = {
  temporal: 'upcoming' | 'current' | 'past';
  capacity: 'under' | 'full' | 'over';
  canceled: boolean;
  isActive: boolean;
};

export type ShiftSummary = {
  id: number;
  title: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM:SS
  endTime: string;    // HH:MM:SS
  location: string | null;
  groupId: number;
  groupTitle: string;
  capacity: number;
  staffCount: number;
  commentCount: number;
  state: ShiftState;
  isJoined: boolean;
};

export type ShiftsPage = {
  items: ShiftSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ShiftsResult =
  | { ok: true; data: ShiftsPage }
  | { ok: false; error: string };

export async function apiGetShifts(
  token: string,
  page: number,
  pageSize = 10,
): Promise<ShiftsResult> {
  try {
    const res = await fetch(
      `${BASE_URL}/shifts?page=${page}&pageSize=${pageSize}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? 'Failed to load shifts.' };
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Could not reach the server.' };
  }
}
