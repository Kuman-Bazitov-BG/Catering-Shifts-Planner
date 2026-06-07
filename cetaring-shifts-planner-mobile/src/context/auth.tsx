import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { apiLogin, apiRegister, type ApiUser } from '@/lib/api';
import { clearToken, loadToken, saveToken } from '@/lib/storage';

type AuthState = {
  user: ApiUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore token from storage and decode user from it.
  // We store the full user object alongside the token so we don't need
  // to decode the JWT on the client — we just trust the server's response.
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await loadToken();
        const storedUser = await loadUser();
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Returns null on success, or an error string on failure.
  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    if (!result.ok) return result.error;

    await saveToken(result.token);
    await saveUser(result.user);
    setToken(result.token);
    setUser(result.user);
    return null;
  }, []);

  // Returns null on success, or an error string on failure.
  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await apiRegister(name, email, password);
    if (!result.ok) return result.error;

    await saveToken(result.token);
    await saveUser(result.user);
    setToken(result.token);
    setUser(result.user);
    return null;
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    await clearUser();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// ── User persistence (same platform split as token storage) ──────────────────

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const USER_KEY = 'auth_user';

async function saveUser(user: ApiUser): Promise<void> {
  const value = JSON.stringify(user);
  if (Platform.OS === 'web') {
    localStorage.setItem(USER_KEY, value);
  } else {
    await SecureStore.setItemAsync(USER_KEY, value);
  }
}

async function loadUser(): Promise<ApiUser | null> {
  try {
    const raw =
      Platform.OS === 'web'
        ? localStorage.getItem(USER_KEY)
        : await SecureStore.getItemAsync(USER_KEY);
    return raw ? (JSON.parse(raw) as ApiUser) : null;
  } catch {
    return null;
  }
}

async function clearUser(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(USER_KEY);
  } else {
    await SecureStore.deleteItemAsync(USER_KEY);
  }
}
