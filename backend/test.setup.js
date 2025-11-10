// Test setup executed before each test file (Jest setupFiles)
// Provide dummy SUPABASE env vars so modules that create a supabase client don't fail during tests
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-test-key';
// Card2Crypto callback secret used by webhook handler in tests
process.env.CARD2CRYPTO_CALLBACK_SECRET = process.env.CARD2CRYPTO_CALLBACK_SECRET || 'test-secret';
process.env.CARD2CRYPTO_API_URL = process.env.CARD2CRYPTO_API_URL || 'https://api.card2crypto.test';

// Ensure Fetch API globals exist for Supabase client in the Node test environment
if (typeof global.Headers === 'undefined') global.Headers = class Headers { constructor() {} };
if (typeof global.Request === 'undefined') global.Request = class Request { constructor() {} };
if (typeof global.Response === 'undefined') global.Response = class Response { constructor() {} };
// Provide a minimal fetch implementation so modules that try to use fetch work in tests
if (typeof global.fetch === 'undefined') {
  global.fetch = async function () { return { ok: true, json: async () => ({}) }; };
}
