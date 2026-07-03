import {
  getToken,
  removeToken,
  setToken
} from "./localStorageService";
import httpClient from "../configurations/httpClient";
import {
  API
} from "../configurations/configuration";
import { useAuthStore } from "@/stores";
import { extractCinemaIdFromToken, extractPermissionsFromToken, extractUserIdFromToken, isTokenExpired } from "@/utils/jwtUtils";

export const login = async (username: string, password: string) => {
  // identity-service endpoint: POST /auth/token (body: {username, password})
  const response = await httpClient.post(API.LOGIN, {
    username: username,
    password: password,
  });

  const token = response.data?.result?.token;

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

  return response;
};

export const logOut = () => {
  removeToken();
  // Clear Zustand store
  useAuthStore.getState().clearAuth();
};

export const isAuthenticated = () => {
  return getToken();
};

// forgotPassword và resetPassword chưa có endpoint trong identity-service microservice
// Stub exports để ForgotPassword page không bị lỗi build
export const forgotPassword = async (_loginIdentifier: string): Promise<any> => {
  console.warn("[DISABLED] forgotPassword — endpoint not available in microservice");
  throw new Error("Forgot password feature is not available in this version.");
};

export const resetPassword = async (
  _loginIdentifier: string,
  _otpCode: string,
  _newPassword: string
): Promise<any> => {
  console.warn("[DISABLED] resetPassword — endpoint not available in microservice");
  throw new Error("Reset password feature is not available in this version.");
};