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

export async function apiRegister(
  name: string,
  email: string,
  password: string,
): Promise<LoginResult> {
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? 'Registration failed.' };
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

export type StaffMember = {
  userId: number;
  name: string;
  extraSlots: number;
};

export type ShiftComment = {
  id: number;
  userId: number;
  authorName: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
};

export type ShiftDetail = ShiftSummary & {
  extraSlots: number | null; // null when not joined
  isManager: boolean;
  staff: StaffMember[];
  comments: ShiftComment[];
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

export type ShiftDetailResult =
  | { ok: true; data: ShiftDetail }
  | { ok: false; error: string };

export type MutationResult =
  | { ok: true }
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

export async function apiGetShiftDetail(
  token: string,
  shiftId: number,
): Promise<ShiftDetailResult> {
  try {
    const res = await fetch(`${BASE_URL}/shifts/${shiftId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? 'Failed to load shift.' };
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Could not reach the server.' };
  }
}

export async function apiJoinShift(
  token: string,
  shiftId: number,
): Promise<MutationResult> {
  try {
    const res = await fetch(`${BASE_URL}/shifts/${shiftId}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? 'Failed to join shift.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach the server.' };
  }
}

export async function apiLeaveShift(
  token: string,
  shiftId: number,
): Promise<MutationResult> {
  try {
    const res = await fetch(`${BASE_URL}/shifts/${shiftId}/leave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? 'Failed to leave shift.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach the server.' };
  }
}

export async function apiSetSlots(
  token: string,
  shiftId: number,
  extraSlots: number,
): Promise<MutationResult> {
  try {
    const res = await fetch(`${BASE_URL}/shifts/${shiftId}/slots`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ extraSlots }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? 'Failed to update slots.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach the server.' };
  }
}

// ── Comments ────────────────────────────────────────────────────────────────

export type CommentsResult =
  | { ok: true; data: ShiftComment[] }
  | { ok: false; error: string };

export async function apiGetComments(
  token: string,
  shiftId: number,
): Promise<CommentsResult> {
  try {
    const res = await fetch(`${BASE_URL}/shifts/${shiftId}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? 'Failed to load comments.' };
    return { ok: true, data: data.items };
  } catch {
    return { ok: false, error: 'Could not reach the server.' };
  }
}

export async function apiAddComment(
  token: string,
  shiftId: number,
  body: string,
): Promise<MutationResult> {
  try {
    const res = await fetch(`${BASE_URL}/shifts/${shiftId}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? 'Failed to post comment.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach the server.' };
  }
}

export async function apiUpdateComment(
  token: string,
  shiftId: number,
  commentId: number,
  body: string,
): Promise<MutationResult> {
  try {
    const res = await fetch(`${BASE_URL}/shifts/${shiftId}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? 'Failed to update comment.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach the server.' };
  }
}

export async function apiDeleteComment(
  token: string,
  shiftId: number,
  commentId: number,
): Promise<MutationResult> {
  try {
    const res = await fetch(`${BASE_URL}/shifts/${shiftId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? 'Failed to delete comment.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach the server.' };
  }
}
