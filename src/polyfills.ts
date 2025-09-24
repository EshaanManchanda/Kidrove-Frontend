// Polyfills for older browsers and environments

// Import whatwg-fetch polyfill for Request/Response APIs
// This is now the PRIMARY polyfill source (no CDN dependency)
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

// Initialize polyfills and update status
try {
  polyfillLog('Loading local whatwg-fetch polyfills...');

  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Update polyfill status after local loading
    const polyfillStatus = {
      fetch: hasFeature(window, 'fetch'),
      request: hasFeature(window, 'Request'),
      response: hasFeature(window, 'Response'),
      headers: hasFeature(window, 'Headers'),
      source: 'bundled' // Mark as bundled polyfills
    };

    // Update global status
    if ((window as any).__POLYFILL_STATUS__) {
      (window as any).__POLYFILL_STATUS__ = polyfillStatus;
    }

    polyfillLog('Post-bundle polyfill status:', polyfillStatus);

    // Ensure globalThis has all APIs
    if (typeof globalThis !== 'undefined') {
      ['fetch', 'Request', 'Response', 'Headers'].forEach(api => {
        if (hasFeature(window, api)) {
          if (!hasFeature(globalThis, api)) {
            try {
              (globalThis as any)[api] = (window as any)[api];
              polyfillLog(`Set ${api} on globalThis from bundled polyfill`);
            } catch (e) {
              polyfillLog(`Failed to set ${api} on globalThis: ${e}`, 'error');
            }
          }
        } else {
          polyfillLog(`${api} not available even after polyfill loading`, 'error');
        }
      });
    }

    // Additional Web API polyfills
    if (!hasFeature(window, 'URL') && hasFeature(window, 'webkitURL')) {
      try {
        (window as any).URL = (window as any).webkitURL;
        polyfillLog('Applied webkitURL polyfill');
      } catch (e) {
        polyfillLog(`Failed to apply URL polyfill: ${e}`, 'error');
      }
    }

    // Feature availability warnings
    if (!hasFeature(window, 'AbortController')) {
      polyfillLog('AbortController not available - some fetch operations may not be cancellable', 'warn');
    }

    // Final verification
    const missingApis = [];
    if (!hasFeature(window, 'fetch')) missingApis.push('fetch');
    if (!hasFeature(window, 'Request')) missingApis.push('Request');
    if (!hasFeature(window, 'Response')) missingApis.push('Response');
    if (!hasFeature(window, 'Headers')) missingApis.push('Headers');

    if (missingApis.length > 0) {
      polyfillLog(`CRITICAL: Missing APIs after local polyfill loading: ${missingApis.join(', ')}`, 'error');
    } else {
      polyfillLog('SUCCESS: All fetch APIs available via local polyfills');
    }
  }
} catch (error) {
  polyfillLog(`Error during local polyfill initialization: ${error}`, 'error');
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