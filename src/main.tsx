// Import whatwg-fetch polyfill for browsers that need it
import 'whatwg-fetch';

// CRITICAL: Apply polyfills IMMEDIATELY before any library imports
// This prevents axios/React Query from trying to destructure undefined globals
(() => {
  // Get the primary global object that libraries will use
  const safeGlobal =
    (typeof globalThis !== 'undefined' && globalThis) ||
    (typeof window !== 'undefined' && window) ||
    (typeof self !== 'undefined' && self) ||
    (typeof global !== 'undefined' && global) ||
    {};

  // Get polyfilled APIs safely
  const getPolyfillAPIs = () => {
    try {
      return {
        fetch: typeof fetch !== 'undefined' ? fetch : undefined,
        Request: typeof Request !== 'undefined' ? Request : undefined,
        Response: typeof Response !== 'undefined' ? Response : undefined,
        Headers: typeof Headers !== 'undefined' ? Headers : undefined,
      };
    } catch (e) {
      console.warn('[Polyfill] Error accessing APIs:', e);
      return { fetch: undefined, Request: undefined, Response: undefined, Headers: undefined };
    }
  };

  const apis = getPolyfillAPIs();

  // Apply to ALL potential global objects immediately
  const allGlobals = [safeGlobal, globalThis, window, global, self].filter(Boolean);

  allGlobals.forEach(globalObj => {
    if (globalObj && typeof globalObj === 'object') {
      Object.keys(apis).forEach(apiName => {
        if (apis[apiName] && !globalObj[apiName]) {
          try {
            Object.defineProperty(globalObj, apiName, {
              value: apis[apiName],
              writable: true,
              enumerable: true,
              configurable: true
            });
          } catch (e) {
            try {
              globalObj[apiName] = apis[apiName];
            } catch (fallbackError) {
              // Silent fail - some globals might be read-only
            }
          }
        }
      });
    }
  });

  // Log final state
  const finalState = {
    globalUsed: safeGlobal === globalThis ? 'globalThis' :
                safeGlobal === window ? 'window' :
                safeGlobal === self ? 'self' :
                safeGlobal === global ? 'global' : 'fallback',
    apis: {
      fetch: !!safeGlobal.fetch,
      Request: !!safeGlobal.Request,
      Response: !!safeGlobal.Response,
      Headers: !!safeGlobal.Headers,
    },
    destructureTest: (() => {
      try {
        const { Request: R, Response: Res } = safeGlobal;
        return { success: !!(R && Res), error: null };
      } catch (e) {
        return { success: false, error: e.message };
      }
    })()
  };

  console.log('[Polyfill] Immediate polyfill applied:', finalState);

  // Set a flag for verification
  safeGlobal.__POLYFILL_STATUS__ = {
    source: 'immediate-fix',
    timestamp: Date.now(),
    state: finalState
  };
})();

// Configure axios adapter fallback BEFORE importing React/libraries
import axios from 'axios';

// Safety net: if fetch adapter fails, fall back to XHR
(() => {
  try {
    // Test if destructuring works
    const testGlobal = globalThis || window;
    const { Request: TestRequest } = testGlobal;
    if (!TestRequest) {
      throw new Error('Request not available for destructuring');
    }
    console.log('[Axios] Fetch adapter should work - Request is available');
  } catch (e) {
    console.warn('[Axios] Fetch adapter may fail, setting XHR adapter as fallback:', e.message);
    try {
      // Import XHR adapter synchronously
      import('axios/lib/adapters/xhr.js').then(xhrModule => {
        axios.defaults.adapter = xhrModule.default;
        console.log('[Axios] XHR adapter configured successfully');
      }).catch(adapterError => {
        console.warn('[Axios] Could not configure XHR adapter:', adapterError);
      });
    } catch (importError) {
      console.warn('[Axios] Could not import XHR adapter:', importError);
    }
  }
})();

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

import { Provider } from 'react-redux';
import { store, persistor } from './store';
import { PersistGate } from 'redux-persist/integration/react';

import App from './App';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CartProvider } from '@/contexts/CartContext';
import ErrorBoundary from '@components/common/ErrorBoundary';

import '@/styles/index.css';
import '@/i18n/config';

// Initialize PWA
import { initializePWA } from './services/pwaService';

// Development-only auth debugging
if (process.env.NODE_ENV === 'development') {
  import('./utils/authDebug');
}

// Axios adapter fallback (in case fetch adapter misbehaves)
(() => {
  try {
    if (!globalThis.Request) {
      throw new Error('Request not available');
    }
    console.log('[Axios] ✅ Fetch adapter should work');
  } catch (e) {
    console.warn('[Axios] ⚠️ Falling back to XHR adapter:', e.message);
    import('axios/lib/adapters/xhr.js')
      .then(xhrModule => {
        axios.defaults.adapter = xhrModule.default;
        console.log('[Axios] ✅ XHR adapter configured');
      })
      .catch(err => {
        console.error('[Axios] ❌ Could not configure XHR adapter:', err);
      });
  }
})();

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Toast config
const toastOptions = {
  duration: 4000,
  position: 'top-right' as const,
  style: {
    background: '#363636',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    maxWidth: '400px',
  },
  success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
  error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
};

// Initialize PWA
initializePWA().catch(console.error);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <QueryClientProvider client={queryClient}>
            <HelmetProvider>
              <LanguageProvider>
                <CurrencyProvider>
                  <ThemeProvider>
                    <AuthProvider>
                      <CartProvider>
                        <ErrorBoundary>
                          <App />
                        </ErrorBoundary>
                      </CartProvider>
                    </AuthProvider>
                  </ThemeProvider>
                </CurrencyProvider>
              </LanguageProvider>
            </HelmetProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
    <Toaster toastOptions={toastOptions} />
  </React.StrictMode>
);