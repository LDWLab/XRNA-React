/**
 * CORS Proxy utility for fetching external APIs that don't support CORS.
 * Uses multiple proxy services with automatic fallback.
 */

// List of CORS proxy services to try in order
const CORS_PROXIES = [
  // allorigins.win - reliable free proxy
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  // corsproxy.io - another free option
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  // cors.sh - alternative
  (url: string) => `https://proxy.cors.sh/${url}`,
];

export interface CorsProxyOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Fetch a URL through a CORS proxy with automatic fallback.
 * Tries multiple proxy services until one succeeds.
 * 
 * @param url - The target URL to fetch
 * @param options - Optional fetch configuration
 * @returns The fetch Response object
 * @throws Error if all proxies fail
 */
export async function fetchWithCorsProxy(
  url: string,
  options: CorsProxyOptions = {}
): Promise<Response> {
  const { timeout = 30000, headers = {} } = options;
  const errors: string[] = [];

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyUrl = CORS_PROXIES[i](url);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          ...headers,
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }
      
      errors.push(`Proxy ${i + 1}: HTTP ${response.status} ${response.statusText}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Proxy ${i + 1}: ${errorMsg}`);
    }
  }

  throw new Error(
    `All CORS proxies failed for ${url}:\n${errors.join('\n')}`
  );
}

/**
 * Fetch JSON data through a CORS proxy with automatic fallback.
 * 
 * @param url - The target URL to fetch
 * @param options - Optional fetch configuration
 * @returns The parsed JSON data
 * @throws Error if all proxies fail or JSON parsing fails
 */
export async function fetchJsonWithCorsProxy<T = unknown>(
  url: string,
  options: CorsProxyOptions = {}
): Promise<T> {
  const response = await fetchWithCorsProxy(url, options);
  return response.json() as Promise<T>;
}
