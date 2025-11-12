/**
 * API configuration utility
 * Uses environment variable for API URL, falls back to localhost in development
 */
export function getApiUrl(): string {
  // In browser, use window.location.origin for same-origin requests
  // In server-side, use environment variable
  if (typeof window !== 'undefined') {
    // Client-side: use environment variable or default to same origin
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      return apiUrl;
    }
    // If no env var, assume API is on same origin (for Vercel serverless functions)
    return '';
  }
  // Server-side: use environment variable or default
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
}

export const apiUrl = getApiUrl();

