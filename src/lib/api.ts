/**
 * API configuration utility
 * Uses environment variable for API URL, falls back to localhost in development
 */
export function getApiUrl(): string {
  // Check for environment variable first
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }

  // In browser (client-side)
  if (typeof window !== 'undefined') {
    // In development, default to localhost:5000
    // In production, this would be handled by environment variable
    if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
      return 'http://localhost:5000';
    }
    // For production without env var, assume API is on same origin
    return '';
  }

  // Server-side: default to localhost:5000
  return 'http://localhost:5000';
}

export const apiUrl = getApiUrl();

