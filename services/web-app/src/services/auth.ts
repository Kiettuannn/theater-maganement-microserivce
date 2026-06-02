import {
  getToken,
  removeToken,
  setToken
} from "./localStorageService";
import httpClient from "../configurations/httpClient";
import {
  API
} from "../configurations/configuration";
import { useAuthStore } from "../stores/useAuthStore";
import { extractCinemaIdFromToken, extractPermissionsFromToken, extractUserIdFromToken, isTokenExpired } from "../utils/jwtUtils";
import { handleApiResponse } from "../utils/apiResponse";

interface RegisterPayload {
  username: string;
  password: string;
  email: string;
  firstname?: string;
  lastname?: string;
  city?: string;
  dob?: string;
}

interface UsernameAvailableResponse {
  available: boolean;
}

export const login = async (username: string, password: string) => {
  const result = await handleApiResponse<{ token?: string }>(
    httpClient.post(API.LOGIN, {
      username: username,
      password: password,
    })
  );

  const token = result?.token;

  if (token) {
    // Check if token is expired (shouldn't happen right after login, but safe to check)
    if (isTokenExpired(token)) {
      throw new Error('Received expired token from server');
    }

    // Extract userId and permissions from token
    const userId = extractUserIdFromToken(token);
    const permissions = extractPermissionsFromToken(token);
    const cinemaId = extractCinemaIdFromToken(token);

    if (!userId) {
      throw new Error('Invalid token: missing user ID');
    }

    // Save token to localStorage
    setToken(token);

    // Update auth store with minimal required data
    useAuthStore.getState().setAuth(token, userId, cinemaId, permissions);
  }

  return result;
};

export const logOut = () => {
  removeToken();
  // Clear Zustand store
  useAuthStore.getState().clearAuth();
};

export const isAuthenticated = () => {
  return getToken();
};

export const forgotPassword = async (username: string) => {
  return handleApiResponse<unknown>(
    httpClient.post(API.FORGOT_PASSWORD, {
      username: username,
    })
  );
};

export const register = async (payload: RegisterPayload) => {
  return handleApiResponse<unknown>(
    httpClient.post(API.REGISTER, payload)
  );
};

export const checkUsernameAvailable = async (username: string) => {
  return handleApiResponse<UsernameAvailableResponse>(
    httpClient.get(API.CHECK_USERNAME, {
      params: {
        username: username,
      },
    })
  );
};

