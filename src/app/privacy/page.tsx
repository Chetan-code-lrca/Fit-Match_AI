import { AppShell } from "@/components/app-shell";

export default function PrivacyPage() {
  return (
    <AppShell
      eyebrow="Privacy"
      title="Your wardrobe data belongs to you."
      description="A plain-language summary of what FitMatch stores and how its current features use that information."
    >
      <div className="mx-auto grid max-w-4xl gap-4">
        <section className="rounded-[24px] border border-white/[0.08] bg-[#191d17] p-6">
          <h2 className="text-lg font-semibold text-[#f4f2e9]">Information stored</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">FitMatch stores your account email through Supabase Auth, clothing descriptions and styling metadata in PostgreSQL, and the clothing images you choose to upload in a private Supabase Storage bucket.</p>
        </section>
        <section className="rounded-[24px] border border-white/[0.08] bg-[#191d17] p-6">
          <h2 className="text-lg font-semibold text-[#f4f2e9]">How recommendations work</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">The core outfit ranking runs using clothing metadata. When OPENAI_API_KEY is configured, FitMatch may send outfit names and colour descriptions to OpenAI to generate optional text explanations. The current explanation flow does not send your uploaded clothing image files to OpenAI.</p>
        </section>
        <section className="rounded-[24px] border border-white/[0.08] bg-[#191d17] p-6">
          <h2 className="text-lg font-semibold text-[#f4f2e9]">Storage and access</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">Wardrobe records are restricted by PostgreSQL Row Level Security. Photos are private and displayed through signed links that expire after approximately one hour. The app uses your signed-in session for data access.</p>
        </section>
        <section className="rounded-[24px] border border-white/[0.08] bg-[#191d17] p-6">
          <h2 className="text-lg font-semibold text-[#f4f2e9]">Your controls</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">From Settings you can download a JSON export of your wardrobe metadata and request permanent account deletion. Deletion removes the account, associated wardrobe rows and private images after the project&apos;s Edge Function is deployed and configured.</p>
        </section>
        <p className="px-1 text-xs leading-6 text-zinc-600">This is a product privacy notice draft, not a complete legal privacy policy. Before public launch, the operator must add a contact address, legal entity details, data-hosting region, retention rules and jurisdiction-specific disclosures.</p>
      </div>
    </AppShell>
  );
}
