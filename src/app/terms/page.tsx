import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#10120f] px-5 py-12 text-[#f4f2e9] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs font-semibold text-[#d3ee9c] hover:underline">← FitMatch home</Link>
        <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d3ee9c]">Terms</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Terms of use</h1>
        <p className="mt-3 text-xs text-zinc-500">Draft terms for FitMatch AI. The operator should obtain appropriate legal review before public launch.</p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-zinc-300">
          <section><h2 className="text-lg font-semibold text-white">Service</h2><p>FitMatch is a wardrobe organisation and styling assistant. Outfit scores and recommendations are heuristic suggestions, not objective measures of fit, quality, suitability or personal identity. You decide what to wear and whether a suggestion is appropriate.</p></section>
          <section><h2 className="text-lg font-semibold text-white">Account responsibility</h2><p>Provide an email address you control, keep your credentials secure and notify the service operator if you suspect unauthorised access. You are responsible for activity performed through your account.</p></section>
          <section><h2 className="text-lg font-semibold text-white">Content and uploads</h2><p>Upload only content you own or are authorised to use. Do not upload unlawful, infringing, harmful or non-consensual content. You retain rights to your uploaded images; you grant the service permission to store and process them solely to provide wardrobe features.</p></section>
          <section><h2 className="text-lg font-semibold text-white">Acceptable use</h2><p>Do not attempt to access another user's data, bypass security controls, disrupt the service, reverse engineer credentials, or upload malicious files. The operator may restrict access to protect the service and its users.</p></section>
          <section><h2 className="text-lg font-semibold text-white">Availability and changes</h2><p>The service may change, be unavailable or be discontinued. Back up information you need by using the account export feature. No uptime commitment is made by this draft.</p></section>
          <section><h2 className="text-lg font-semibold text-white">Contact and governing terms</h2><p>The operator must add its legal name, contact address, effective date and governing-law details after review. These draft terms are not ready to substitute for legal advice or a final customer agreement.</p></section>
        </div>
      </div>
    </main>
  );
}
