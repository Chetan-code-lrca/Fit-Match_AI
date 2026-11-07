/**
 * The JSON wardrobe and public/uploads directory are local demo storage only.
 * They are not user-isolated, durable, or safe for an internet-facing deployment.
 */
export function isLocalDemoStorageAllowed(env = process.env) {
  return (
    env.NODE_ENV !== "production" ||
    env.FITMATCH_ALLOW_INSECURE_LOCAL_STORAGE === "true"
  );
}
