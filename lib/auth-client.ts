/**
 * Client-side auth token management.
 * Loads token from API endpoint and stores in memory.
 */

let cachedToken: string | null = null;

/**
 * Get the auth token from server.
 * Token is required for all authenticated API calls.
 */
export async function getAuthToken(): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }

  try {
    const res = await fetch('/api/auth/token');
    if (!res.ok) {
      throw new Error('Failed to fetch auth token');
    }
    const data = await res.json();
    cachedToken = data.token || null;
    if (!cachedToken) {
      throw new Error('Auth token was empty');
    }
    return cachedToken;
  } catch (err) {
    console.error('Failed to load auth token:', err);
    throw err;
  }
}

/**
 * Make an authenticated API request.
 * Automatically adds auth token header.
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  
  const headers = new Headers(options.headers);
  headers.set('X-clawharbor-Token', token);
  
  return fetch(url, {
    ...options,
    headers,
  });
}
