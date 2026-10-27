// Legacy local JWT/password/refresh implementation retired from the runtime.
// Existing database hashes/tokens are preserved for the approved account cutover.
// All active authentication is implemented in modules/auth via Supabase Auth.
export {};
