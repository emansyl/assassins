import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client without strict Database types.
 * Used in admin components where RLS-typed generics generate `never` for mutations
 * that are only allowed for the game master via RLS policies.
 */
export function createUntypedClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
