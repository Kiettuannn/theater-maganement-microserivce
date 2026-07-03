/**
 * Application configuration
 * Centralized configuration for the entire application
 */

export const APP_CONFIG = {
  // Base path for the application (e.g., '/admin', '/', etc.)
  BASE_PATH: import.meta.env.VITE_BASE_PATH || '/',
  
  // API configuration
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  
  // Application info
  APP_NAME: 'Cinema Manager',
  APP_VERSION: '1.0.0',
} as const;

/**
 * Helper function to get full route path with base path
 * @param path - The route path (e.g., '/movies', '/settings/profile')
 * @returns Full path with base path prefix
 */
export function getRoutePath(path: string): string {
  // Remove leading slash from path if exists
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // If base path is '/', just return the path with leading slash
  if (APP_CONFIG.BASE_PATH === '/') {
    return `/${cleanPath}`;
  }
  
  // Otherwise, combine base path with the route path
  return `${APP_CONFIG.BASE_PATH}/${cleanPath}`;
}
