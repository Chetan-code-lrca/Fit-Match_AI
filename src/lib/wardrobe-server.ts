/**
 * Server-side wardrobe access. Runtime persistence is Supabase PostgreSQL with RLS.
 * This module intentionally no longer reads the former shared JSON file.
 */
export { readUserWardrobeItems } from "@/lib/supabase-rest";
