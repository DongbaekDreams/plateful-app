import { Platform } from 'react-native';

/**
 * Get the API base URL based on environment configuration
 * 
 * Environment variables:
 * - EXPO_PUBLIC_API_MODE: "local" | "hosted" (defaults to "local")
 * - EXPO_PUBLIC_API_BASE_URL: Direct URL override (optional, overrides API_MODE if set)
 * 
 * When "local":
 * - Web/iOS: http://localhost:3001
 * - Android emulator: http://10.0.2.2:3001
 * 
 * When "hosted":
 * - All platforms: https://plateful-app-cartwrightjacob-5796s-projects.vercel.app/api
 */
export const getApiBaseUrl = (): string => {
  // Check for direct URL override first
  const directUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (directUrl) {
    return directUrl;
  }

  // Check API mode
  const apiMode = process.env.EXPO_PUBLIC_API_MODE || 'local';

  if (apiMode === 'hosted') {
    // Use Vercel hosted URL (production alias - cleaner URL)
    return 'https://plateful-app-cartwrightjacob-5796s-projects.vercel.app/api';
  }

  // Default to local development
  // Platform-specific URLs for local development
  return Platform.select({
    web: 'http://localhost:3001',
    android: 'http://10.0.2.2:3001', // Android emulator uses special IP
    ios: 'http://localhost:3001',
    default: 'http://localhost:3001',
  }) || 'http://localhost:3001';
};

/**
 * API base URL - use this constant throughout the app
 */
export const API_BASE = getApiBaseUrl();

