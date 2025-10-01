/**
 * CRITICAL POLYFILLS - Must execute FIRST before any other code
 *
 * This file patches the global environment to ensure axios and other libraries
 * can properly destructure fetch API objects from the global scope.
 *
 * IMPORTANT: This file is bundled into the main entry chunk (not a separate chunk)
 * to guarantee synchronous execution before any other modules load.
 */

// Import whatwg-fetch polyfill for browsers that need it
import 'whatwg-fetch';

/**
 * Comprehensive global patching for all global object variations
 */
function patchGlobalEnvironment() {
  // Get all possible global objects
  const allGlobals: any[] = [];

  if (typeof globalThis !== 'undefined') allGlobals.push(globalThis);
  if (typeof window !== 'undefined') allGlobals.push(window);
  if (typeof self !== 'undefined') allGlobals.push(self);
  if (typeof global !== 'undefined') allGlobals.push(global);

  // Primary global object (what axios will use)
  const primaryGlobal = (typeof globalThis !== 'undefined' && globalThis) ||
                        (typeof window !== 'undefined' && window) ||
                        (typeof self !== 'undefined' && self) ||
                        (typeof global !== 'undefined' && global) ||
                        {};

  // Ensure window.global points to window (critical for axios)
  if (typeof window !== 'undefined') {
    if (!(window as any).global) {
      (window as any).global = window;
    }
    if (!allGlobals.includes((window as any).global)) {
      allGlobals.push((window as any).global);
    }
  }

  // Get fetch API references
  const fetchAPIs = {
    fetch: typeof fetch !== 'undefined' ? fetch : undefined,
    Request: typeof Request !== 'undefined' ? Request : undefined,
    Response: typeof Response !== 'undefined' ? Response : undefined,
    Headers: typeof Headers !== 'undefined' ? Headers : undefined,
  };

  // Patch all global objects with fetch APIs
  let patchedCount = 0;
  for (const globalObj of allGlobals) {
    if (!globalObj || typeof globalObj !== 'object') continue;

    for (const [apiName, apiValue] of Object.entries(fetchAPIs)) {
      if (!apiValue) continue;

      try {
        // Check if already properly defined
        const descriptor = Object.getOwnPropertyDescriptor(globalObj, apiName);
        if (descriptor && descriptor.enumerable && descriptor.value === apiValue) {
          continue; // Already properly patched
        }

        // Delete any existing non-enumerable property
        if (descriptor) {
          delete globalObj[apiName];
        }

        // Define as enumerable (CRITICAL for destructuring)
        Object.defineProperty(globalObj, apiName, {
          value: apiValue,
          writable: true,
          enumerable: true,  // Must be true for destructuring to work
          configurable: true
        });

        patchedCount++;
      } catch (error) {
        // Fallback: direct assignment
        try {
          globalObj[apiName] = apiValue;
          patchedCount++;
        } catch (e) {
          console.warn(`[Polyfills] Failed to patch ${apiName}:`, e);
        }
      }
    }
  }

  // Verification: Test destructuring
  let destructureWorks = false;
  try {
    const { Request: R, Response: Res, Headers: H, fetch: F } = primaryGlobal;
    destructureWorks = !!(R && Res && H && F);
  } catch (error) {
    console.error('[Polyfills] Destructuring test failed:', error);
  }

  // Log status (always log in production for debugging)
  const status = {
    timestamp: new Date().toISOString(),
    patchedProperties: patchedCount,
    primaryGlobal: primaryGlobal === globalThis ? 'globalThis' :
                   primaryGlobal === window ? 'window' :
                   primaryGlobal === self ? 'self' : 'global',
    destructureWorks,
    apis: {
      fetch: !!fetchAPIs.fetch,
      Request: !!fetchAPIs.Request,
      Response: !!fetchAPIs.Response,
      Headers: !!fetchAPIs.Headers,
    },
    verification: {
      requestEnumerable: primaryGlobal.propertyIsEnumerable?.('Request') || false,
      responseEnumerable: primaryGlobal.propertyIsEnumerable?.('Response') || false,
    }
  };

  console.log('[Polyfills] ✅ Global environment patched:', status);

  if (!destructureWorks) {
    console.error('[Polyfills] ⚠️ WARNING: Destructuring test failed! Axios may not work correctly.');
  }

  return status;
}

// Execute polyfill immediately (synchronous)
if (typeof window !== 'undefined') {
  patchGlobalEnvironment();

  // Store status for debugging
  (window as any).__POLYFILL_STATUS__ = {
    loaded: true,
    timestamp: Date.now(),
    version: '2.0',
  };
}

// Export empty object to make this a module
export {};
