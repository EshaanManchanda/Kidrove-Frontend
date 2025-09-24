// Polyfills for older browsers and environments

// Import whatwg-fetch polyfill for Request/Response APIs
// Note: This is a backup - primary polyfills are loaded via index.html
import 'whatwg-fetch';

// Safe console logging for polyfill status
const polyfillLog = (message: string, level: 'log' | 'warn' | 'error' = 'log') => {
  if (typeof console !== 'undefined' && console[level]) {
    console[level](`[Polyfills] ${message}`);
  }
};

// Feature detection helper
const hasFeature = (obj: any, prop: string): boolean => {
  try {
    return obj && typeof obj[prop] !== 'undefined';
  } catch (e) {
    return false;
  }
};

// Ensure global fetch, Request, Response, and Headers are available
try {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Fetch API polyfills
    if (!hasFeature(window, 'fetch')) {
      polyfillLog('Fetch API not available, using polyfill', 'warn');
    }

    if (!hasFeature(window, 'Request')) {
      polyfillLog('Request API not available, using polyfill', 'warn');
    }

    if (!hasFeature(window, 'Response')) {
      polyfillLog('Response API not available, using polyfill', 'warn');
    }

    if (!hasFeature(window, 'Headers')) {
      polyfillLog('Headers API not available, using polyfill', 'warn');
    }

    // Apply global fixes if needed
    if (typeof globalThis !== 'undefined') {
      // Modern environments - ensure globalThis has required APIs
      ['fetch', 'Request', 'Response', 'Headers'].forEach(api => {
        if (!hasFeature(globalThis, api) && hasFeature(window, api)) {
          try {
            (globalThis as any)[api] = (window as any)[api];
          } catch (e) {
            polyfillLog(`Failed to set ${api} on globalThis: ${e}`, 'error');
          }
        }
      });
    }

    // Additional Web API checks and polyfills
    if (!hasFeature(window, 'URL') && hasFeature(window, 'webkitURL')) {
      try {
        (window as any).URL = (window as any).webkitURL;
        polyfillLog('Using webkitURL as URL polyfill');
      } catch (e) {
        polyfillLog(`Failed to set URL polyfill: ${e}`, 'error');
      }
    }

    // AbortController check
    if (!hasFeature(window, 'AbortController')) {
      polyfillLog('AbortController not available - some fetch operations may not be cancellable', 'warn');
    }

    // Promise check (should be available in modern environments)
    if (!hasFeature(window, 'Promise')) {
      polyfillLog('Promise not available - application may not work correctly', 'error');
    }

    // Array methods check
    if (!Array.prototype.find) {
      polyfillLog('Array.prototype.find not available', 'warn');
    }

    if (!Array.prototype.includes) {
      polyfillLog('Array.prototype.includes not available', 'warn');
    }

    // Object methods check
    if (!Object.assign) {
      polyfillLog('Object.assign not available', 'warn');
    }

    polyfillLog('Polyfill initialization complete');
  }
} catch (error) {
  polyfillLog(`Error during polyfill initialization: ${error}`, 'error');
}

// Export feature detection utilities for use in components
export const features = {
  fetch: typeof fetch !== 'undefined',
  request: typeof Request !== 'undefined',
  response: typeof Response !== 'undefined',
  headers: typeof Headers !== 'undefined',
  abortController: typeof AbortController !== 'undefined',
  url: typeof URL !== 'undefined',
  promise: typeof Promise !== 'undefined',
};

// Safe fetch wrapper with error handling
export const safeFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  if (!features.fetch) {
    throw new Error('Fetch API not available and polyfill failed to load');
  }

  try {
    return await fetch(input, init);
  } catch (error) {
    console.error('[SafeFetch] Request failed:', error);
    throw error;
  }
};

export {}; // Make this a module