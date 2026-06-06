const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

export type ApiUser = { id: number; name: string; email: string };

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

    if (!res.ok) {
      return { ok: false, error: data.error ?? 'Login failed.' };
    }

    return { ok: true, token: data.token, user: data.user };
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your connection.' };
  }
}
