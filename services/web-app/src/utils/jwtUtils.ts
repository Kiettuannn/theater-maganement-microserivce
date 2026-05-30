import { jwtDecode } from 'jwt-decode';

/**
 * JWT Utility functions for decoding and extracting token information
 * Using jwt-decode library for robust token handling
 */

export interface DecodedToken {
  iss?: string;
  sub?: string;
  exp?: number;
  iat?: number;
  jti?: string;
  scope?: string;
  [key: string]: any;
}

/**
 * Decode JWT token (without verification - for client-side only)
 * Note: This is for client-side only and doesn't verify the signature
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    if (!token || typeof token !== 'string') {
      console.error('Invalid token: token must be a non-empty string');
      return null;
    }

    const decoded = jwtDecode<DecodedToken>(token);
    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Extract permissions from token scope
 * Token scope format: "ROLE_ADMIN BOOKING_DELETE COMBO_READ ..."
 */
export const extractPermissionsFromToken = (token: string): string[] => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.scope) {
      return [];
    }

    if (typeof decoded.scope !== 'string') {
      console.warn('Invalid scope format in token');
      return [];
    }

    return decoded.scope
      .split(' ')
      .map(p => p.trim())
      .filter(permission => permission !== '');
  } catch (error) {
    console.error('Failed to extract permissions from token:', error);
    return [];
  }
};

/**
 * Extract user ID (sub claim) from token
 */
export const extractUserIdFromToken = (token: string): string | null => {
  try {
    const decoded = decodeToken(token);
    return decoded?.sub || null;
  } catch (error) {
    console.error('Failed to extract user ID from token:', error);
    return null;
  }
};


/**
 * Extract cinema ID from token
 */
export const extractCinemaIdFromToken = (token: string): string | null => {
  try {
    const decoded = decodeToken(token);
    return decoded?.cinemaId || null;
  } catch (error) {
    console.error('Failed to extract cinema ID from token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * Returns true if token is expired or invalid
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    // exp is in seconds, convert to milliseconds
    const expirationTime = decoded.exp * 1000;
    return Date.now() >= expirationTime;
  } catch (error) {
    console.error('Failed to check token expiration:', error);
    return true;
  }
};

/**
 * Get token expiration time
 */
export const getTokenExpirationTime = (token: string): Date | null => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch (error) {
    console.error('Failed to get token expiration time:', error);
    return null;
  }
};

/**
 * Get time until token expires in milliseconds
 */
export const getTimeUntilExpiration = (token: string): number | null => {
  try {
    const expirationTime = getTokenExpirationTime(token);
    if (!expirationTime) {
      return null;
    }

    return expirationTime.getTime() - Date.now();
  } catch (error) {
    console.error('Failed to get time until expiration:', error);
    return null;
  }
};
