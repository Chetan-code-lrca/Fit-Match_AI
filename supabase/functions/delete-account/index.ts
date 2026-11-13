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
    let allImagesRemoved = false;

    // Always read from offset 0 because removing a page shifts the remaining list.
    for (let batch = 0; batch < 200; batch += 1) {
      const { data: objects, error: listError } = await storage.list(user.id, {
        limit,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });
      if (listError) return jsonError("Unable to prepare private image deletion.", 502);
      if (!objects || objects.length === 0) {
        allImagesRemoved = true;
        break;
      }

      const paths = objects
        .filter((object) => Boolean(object.id) && Boolean(object.name))
        .map((object) => user.id + "/" + object.name);

      // Unexpected nested folders are treated as a hard failure, never silently skipped.
      if (paths.length === 0) {
        return jsonError("Unexpected private storage layout. Account deletion was stopped.", 409);
      }

      const { error: removeError } = await storage.remove(paths);
      if (removeError) return jsonError("Unable to remove all private wardrobe images. Please retry.", 502);
    }

    if (!allImagesRemoved) {
      return jsonError("Too many private images to delete in one request. Contact support.", 409);
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) return jsonError("Unable to delete the account. Please retry.", 502);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders });
  } catch {
    return jsonError("Account deletion failed. Please retry or contact support.", 500);
  }
});
