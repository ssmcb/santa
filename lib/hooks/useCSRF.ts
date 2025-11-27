'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to get and manage CSRF token
 *
 * Usage:
 * ```typescript
 * const { token, isLoading } = useCSRF();
 *
 * // Use token in fetch requests
 * fetch('/api/endpoint', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'X-CSRF-Token': token,
 *   },
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export function useCSRF() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const response = await fetch('/api/csrf/token');
        if (!response.ok) {
          throw new Error('Failed to fetch CSRF token');
        }
        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch CSRF token');
        console.error('CSRF token fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchToken();
  }, []);

  return { token, isLoading, error };
}

/**
 * Helper function to make CSRF-protected fetch requests
 *
 * Usage:
 * ```typescript
 * const result = await csrfFetch('/api/endpoint', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Get CSRF token
  const tokenResponse = await fetch('/api/csrf/token');
  if (!tokenResponse.ok) {
    throw new Error('Failed to get CSRF token');
  }
  const { token } = await tokenResponse.json();

  // Make request with CSRF token
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': token,
    },
  });
}
