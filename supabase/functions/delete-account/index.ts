import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ message }), { status, headers: jsonHeaders });
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return jsonError("Method not allowed.", 405);

  const authorization = request.headers.get("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!authorization || !token) return jsonError("Authentication required.", 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonError("Account deletion is not configured on this project.", 503);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: userResult, error: userError } = await userClient.auth.getUser(token);
  const user = userResult.user;
  if (userError || !user) return jsonError("The session is invalid or expired.", 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // Object names are created as {verified-user-id}/{uuid}.webp.
    // The user id is derived from the verified JWT, never from a request field.
    const storage = adminClient.storage.from("wardrobe-private");
    const limit = 500;
    for (let offset = 0; offset < 10_000; offset += limit) {
      const { data: objects, error: listError } = await storage.list(user.id, {
        limit,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (listError) return jsonError("Unable to prepare private image deletion.", 502);

      const paths = (objects ?? [])
        .filter((object) => Boolean(object.id) && Boolean(object.name))
        .map((object) => user.id + "/" + object.name);

      if (paths.length) {
        const { error: removeError } = await storage.remove(paths);
        if (removeError) return jsonError("Unable to remove all private wardrobe images. Please retry.", 502);
      }
      if (!objects || objects.length < limit) break;
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) return jsonError("Unable to delete the account. Please retry.", 502);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders });
  } catch {
    return jsonError("Account deletion failed. Please retry or contact support.", 500);
  }
});
