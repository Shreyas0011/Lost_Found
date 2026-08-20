const { createClient } = require('@supabase/supabase-js');
const config = require('../../config/supabase');

/**
 * Creates Supabase clients:
 * 1. supabase: Standard client using Anon key
 * 2. supabaseAdmin: Server-side admin client using Service Role key
 */
const isTest = process.env.NODE_ENV === 'test';
const isRealTest = process.env.USE_REAL_SUPABASE === 'true';
const useMockClient = isTest && !isRealTest;

const isKeysConfigured =
  config.url &&
  !config.url.includes('placeholder-project') &&
  config.anonKey &&
  !config.anonKey.includes('placeholder') &&
  config.serviceRoleKey &&
  !config.serviceRoleKey.includes('placeholder');

let supabase = null;
let supabaseAdmin = null;

if (!useMockClient) {
  // Real Supabase client initialization for development, production, and live integration verification
  supabase = createClient(config.url, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  supabaseAdmin = createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
} else {
  // Unit test mock client for fast, isolated test suite execution
  const dummyClient = {
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), range: async () => ({ data: [], error: null, count: 0 }) }), is: () => ({ order: () => ({ range: async () => ({ data: [], error: null, count: 0 }) }) }) }),
      insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'mock-id', status: 'uploading' }, error: null }) }) }),
      update: () => ({ eq: () => ({ is: () => ({ select: () => ({ single: async () => ({ data: { id: 'mock-id', status: 'active' }, error: null }) }) }) }) }),
      delete: () => ({ eq: async () => ({ data: [], error: null }) }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'dummy-key' }, error: null }),
        remove: async () => ({ data: [], error: null }),
        createSignedUrl: async () => ({ data: { signedUrl: `${config.url}/storage/v1/object/sign/project-assets/dummy-key` }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: `${config.url}/storage/v1/object/public/project-assets/dummy-key` } }),
        list: async () => ({ data: [{ name: 'dummy-key' }], error: null }),
      }),
    },
  };
  supabase = dummyClient;
  supabaseAdmin = dummyClient;
}

module.exports = {
  supabase,
  supabaseAdmin,
  isConfigured: isKeysConfigured,
  useMockClient,
};
