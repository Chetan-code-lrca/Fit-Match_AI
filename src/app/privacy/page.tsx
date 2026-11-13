import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#10120f] px-5 py-12 text-[#f4f2e9] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs font-semibold text-[#d3ee9c] hover:underline">← FitMatch home</Link>
        <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d3ee9c]">Privacy</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Privacy notice</h1>
        <p className="mt-3 text-xs text-zinc-500">Draft for the FitMatch AI service. The operator must review this notice and add a real contact address and applicable retention periods before public launch.</p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-zinc-300">
          <section><h2 className="text-lg font-semibold text-white">Data we store</h2><p>When you create an account, FitMatch receives your email address and authentication identifiers from Supabase Auth. Wardrobe entries may contain garment names, categories, colours, style tags, occasions, seasons and private image object references. The application does not ask for biometric data or body measurements.</p></section>
          <section><h2 className="text-lg font-semibold text-white">How images are handled</h2><p>Wardrobe images are stored in a private Supabase Storage bucket under your account identifier. The application issues short-lived signed upload and read URLs. Images are not intentionally published as public assets. Do not upload photographs of other people or images you do not have permission to store.</p></section>
          <section><h2 className="text-lg font-semibold text-white">Providers</h2><p>Supabase provides authentication, database and image storage. If the operator configures an OpenAI API key, selected outfit metadata may be sent to OpenAI to enrich styling explanations. The core deterministic matching flow is designed to operate without that optional integration. Review active provider settings before using the service.</p></section>
          <section><h2 className="text-lg font-semibold text-white">Use and protection</h2><p>Data is used to save your wardrobe and generate styling suggestions. Access is restricted by authenticated sessions and database/storage ownership policies. No security control can guarantee absolute protection; keep your password private and sign out on shared devices.</p></section>
          <section><h2 className="text-lg font-semibold text-white">Your choices</h2><p>You can export your wardrobe metadata from Settings. You can request permanent account deletion from the same screen; the application removes your account's stored images before deleting the authentication identity. An export contains wardrobe metadata and private storage paths, not embedded image bytes.</p></section>
          <section><h2 className="text-lg font-semibold text-white">Retention and contact</h2><p>Account data is retained while the account remains active. The service operator must define and publish a retention period for operational logs and backups. Add a monitored support/contact email and legally required disclosures before enabling public registration.</p></section>
        </div>
      </div>
    </main>
  );
}
