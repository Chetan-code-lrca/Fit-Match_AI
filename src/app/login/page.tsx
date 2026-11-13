import { AuthForm } from "@/components/auth-form";

type LoginPageProps = {
  searchParams?: Promise<{ setup?: string; verified?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : undefined;
  const notice = params.setup === "required"
    ? "Supabase is not configured on this deployment. Add the project URL and publishable key to the server environment."
    : params.verified === "1"
      ? "Email verified. Sign in to open your wardrobe."
      : undefined;
  return <AuthForm mode="login" notice={notice} nextPath={nextPath} />;
}
