import { useCallback, useRef, useEffect } from 'react';

/**
 * Hook for making authenticated API requests.
 * Automatically adds auth token to requests.
 */
export function useAuthenticatedFetch() {
  const tokenRef = useRef<string | null>(null);
  const tokenPromiseRef = useRef<Promise<string> | null>(null);

  // Load token on mount
  useEffect(() => {
    const loadToken = async () => {
      if (tokenRef.current) return;
      if (tokenPromiseRef.current) return;

      tokenPromiseRef.current = (async () => {
        try {
          const res = await fetch('/api/auth/token');
          if (!res.ok) throw new Error('Failed to fetch token');
          const data = await res.json();
          tokenRef.current = data.token;
          return data.token;
        } catch (err) {
          console.error('Failed to load auth token:', err);
          throw err;
        } finally {
          tokenPromiseRef.current = null;
        }
      })();

      await tokenPromiseRef.current;
    };

    loadToken();
  }, []);

  const authenticatedFetch = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    // Ensure token is loaded
    if (!tokenRef.current) {
      if (tokenPromiseRef.current) {
        await tokenPromiseRef.current;
      } else {
        const res = await fetch('/api/auth/token');
        const data = await res.json();
        tokenRef.current = data.token;
      }
    }

    // Add auth header
    const headers = new Headers(options.headers);
    headers.set('X-clawharbor-Token', tokenRef.current!);

    return fetch(url, {
      ...options,
      headers,
    });
  }, []);

  return authenticatedFetch;
}
