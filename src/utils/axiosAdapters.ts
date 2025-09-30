// Custom axios adapters module that only includes XHR adapter
// This replaces axios/lib/adapters/adapters.js to avoid bundling the broken fetch adapter

// @ts-ignore
import xhrAdapter from 'axios/lib/adapters/xhr.js';

// Simplified adapter resolution - only return XHR
export default {
  getAdapter: () => xhrAdapter,
  adapters: {
    xhr: xhrAdapter,
    http: xhrAdapter, // Use XHR for http as well in browser
    fetch: false // Disable fetch adapter
  }
};