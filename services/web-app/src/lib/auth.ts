export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser;
}

export interface LoginPayload {
  username: string;
  password: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH ?? '/auth/login';
const AUTH_STORAGE_KEY = 'auth-session';

const joinUrl = (baseUrl: string, path: string) => {
  if (!baseUrl) {
    return path;
  }
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const parseLoginResponse = (data: Record<string, unknown>): AuthSession => {
  const accessToken =
    typeof data.accessToken === 'string'
      ? data.accessToken
      : typeof data.token === 'string'
        ? data.token
        : '';

  if (!accessToken) {
    throw new Error('Login response missing access token.');
  }

  const refreshToken = typeof data.refreshToken === 'string' ? data.refreshToken : undefined;
  const user = typeof data.user === 'object' && data.user ? (data.user as AuthUser) : undefined;

  return {
    accessToken,
    refreshToken,
    user,
  };
};

export const getAuthSession = (): AuthSession | null => {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) {
    return null;
  }
  try {
    return JSON.parse(stored) as AuthSession;
  } catch (error) {
    console.error('Failed to parse auth session:', error);
    return null;
  }
};

export const setAuthSession = (session: AuthSession) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const login = async (payload: LoginPayload): Promise<AuthSession> => {
  const response = await fetch(joinUrl(API_BASE_URL, LOGIN_PATH), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Login failed.');
  }

  const data = (await response.json()) as Record<string, unknown>;
  const session = parseLoginResponse(data);
  setAuthSession(session);
  return session;
};
