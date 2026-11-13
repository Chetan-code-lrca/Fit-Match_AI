import { NextResponse } from "next/server";

/**
 * The filesystem wardrobe adapter is intentionally development-only.
 * A production database/auth/storage adapter must replace it before launch.
 */
export function rejectUnsafeProductionStorage() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        code: "PRODUCTION_STORAGE_NOT_CONFIGURED",
        message:
          "Wardrobe persistence is disabled in production until authenticated, user-scoped database and private object storage are configured.",
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  return null;
}
