/**
 * Polyfills for browser compatibility
 * This file must be imported FIRST before any other application code
 * to ensure fetch API and global object are available for all chunks
 */

// Import whatwg-fetch polyfill for fetch API
import 'whatwg-fetch';

// Ensure global object is properly set up for axios and other libraries
if (typeof window !== 'undefined') {
  // Patch window.global to point to window (required by some Node.js-style libraries)
  if (!(window as any).global) {
    (window as any).global = window;
  }

  // Ensure fetch API is available on the global object
  // This is critical for axios which destructures from global
  const globalObj = (window as any).global;

  // Define fetch API properties as enumerable for destructuring
  if (typeof fetch !== 'undefined' && !globalObj.fetch) {
    Object.defineProperty(globalObj, 'fetch', {
      value: fetch,
      writable: true,
      enumerable: true,
      configurable: true
    });
  }

  if (typeof Request !== 'undefined' && !globalObj.Request) {
    Object.defineProperty(globalObj, 'Request', {
      value: Request,
      writable: true,
      enumerable: true,
      configurable: true
    });
  }

  if (typeof Response !== 'undefined' && !globalObj.Response) {
    Object.defineProperty(globalObj, 'Response', {
      value: Response,
      writable: true,
      enumerable: true,
      configurable: true
    });
  }

  if (typeof Headers !== 'undefined' && !globalObj.Headers) {
    Object.defineProperty(globalObj, 'Headers', {
      value: Headers,
      writable: true,
      enumerable: true,
      configurable: true
    });
  }

  // Log polyfill status for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[Polyfills] Loaded successfully', {
      fetch: typeof fetch !== 'undefined',
      Request: typeof Request !== 'undefined',
      Response: typeof Response !== 'undefined',
      Headers: typeof Headers !== 'undefined',
      global: !!(window as any).global
    });
  }
}

// Export empty object to make this a module
export {};
