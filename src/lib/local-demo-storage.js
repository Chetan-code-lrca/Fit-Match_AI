/**
 * The JSON wardrobe and public/uploads directory are local demo storage only.
 * They are not user-isolated, durable, or safe for an internet-facing deployment.
 * The production opt-in is intentionally explicit and must only be used in an
 * isolated demonstration environment.
 */
export function isLocalDemoStorageAllowed(env = process.env) {
  return (
    env.NODE_ENV !== "production" ||
    env.FITMATCH_ALLOW_INSECURE_LOCAL_STORAGE === "true"
  );
}
