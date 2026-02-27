import { useState, useEffect } from 'react';

/**
 * Hook to get the auth token for use in URLs (e.g., video src).
 * Since <video> elements can't send custom headers, we need to include
 * the token as a query parameter.
 */
export function useAuthToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const res = await fetch('/api/auth/token');
        if (!res.ok) throw new Error('Failed to fetch token');
        const data = await res.json();
        setToken(data.token);
      } catch (err) {
        console.error('Failed to load auth token:', err);
      }
    };

    loadToken();
  }, []);

  return token;
}
