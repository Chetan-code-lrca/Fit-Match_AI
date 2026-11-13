"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/dashboard", label: "Overview", icon: "⌂" },
  { href: "/upload", label: "My closet", icon: "▦" },
  { href: "/suggestions", label: "Outfit lab", icon: "✳" },
  { href: "/chat", label: "Stylist", icon: "✧" },
  { href: "/settings", label: "Preferences", icon: "⚙" },
];
function isActivePath(pathname: string, href: string) { return pathname === href || pathname.startsWith(href + "/"); }

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<{ user?: { email?: string | null } }> : null)
      .then((payload) => { if (active) setEmail(payload?.user?.email ?? null); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [pathname]);

  async function handleSignOut() {
    setSigningOut(true);
    try { await fetch("/api/auth/sign-out", { method: "POST" }); }
    finally { setEmail(null); setSigningOut(false); router.replace("/login"); router.refresh(); }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#11140f]/90 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-10">
        <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="FitMatch AI home"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#d3ee9c] text-sm font-black tracking-[-0.08em] text-[#182011]">FM</span><span className="min-w-0"><span className="block truncate text-[13px] font-bold tracking-[0.13em] text-[#f4f2e9]">FITMATCH</span><span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-500">Wardrobe intelligence</span></span></Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.025] p-1 md:flex">
          {links.map((link) => { const active = isActivePath(pathname, link.href); return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={"rounded-full px-4 py-2 text-xs font-medium transition " + (active ? "bg-[#d3ee9c] text-[#182011] shadow-sm" : "text-zinc-400 hover:bg-white/[0.07] hover:text-white")}>{link.label}</Link>; })}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {email ? <><span className="hidden max-w-36 truncate text-[10px] text-zinc-500 xl:block" title={email}>{email}</span><button type="button" onClick={handleSignOut} disabled={signingOut} className="hidden rounded-full border border-white/10 px-3.5 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-red-300/30 hover:text-red-200 sm:inline-flex">{signingOut ? "Signing out…" : "Sign out"}</button></> : <Link href="/login" className="hidden rounded-full border border-[#d3ee9c]/25 bg-[#d3ee9c]/[0.08] px-4 py-2.5 text-xs font-semibold text-[#d3ee9c] sm:inline-flex">Sign in</Link>}
          <Link href="/upload" className="hidden items-center gap-2 rounded-full border border-[#d3ee9c]/25 bg-[#d3ee9c]/[0.08] px-4 py-2.5 text-xs font-semibold text-[#d3ee9c] sm:inline-flex">+ Add pieces</Link>
          <button type="button" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((previous) => !previous)} className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-white/10 text-zinc-200 transition hover:bg-white/10 md:hidden"><span className={"block h-0.5 w-4 rounded bg-current transition-all " + (mobileOpen ? "translate-y-2 rotate-45" : "")} /><span className={"block h-0.5 w-4 rounded bg-current transition-all " + (mobileOpen ? "opacity-0" : "")} /><span className={"block h-0.5 w-4 rounded bg-current transition-all " + (mobileOpen ? "-translate-y-2 -rotate-45" : "")} /></button>
        </div>
      </div>
      {mobileOpen ? <div className="border-t border-white/[0.08] bg-[#11140f] px-4 pb-4 pt-3 md:hidden"><nav aria-label="Mobile navigation" className="mx-auto grid max-w-[1440px] gap-1 sm:px-2">{links.map((link) => { const active = isActivePath(pathname, link.href); return <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} aria-current={active ? "page" : undefined} className={"flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition " + (active ? "bg-[#d3ee9c] font-semibold text-[#182011]" : "text-zinc-300 hover:bg-white/[0.06]")}><span className="w-5 text-center text-base" aria-hidden="true">{link.icon}</span>{link.label}</Link>; })}{email ? <button type="button" onClick={() => { setMobileOpen(false); void handleSignOut(); }} className="mt-2 rounded-2xl border border-white/10 px-4 py-3 text-left text-sm text-zinc-300">Sign out · {email}</button> : <Link href="/login" onClick={() => setMobileOpen(false)} className="mt-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-[#d3ee9c]">Sign in</Link>}<Link href="/upload" onClick={() => setMobileOpen(false)} className="mt-2 flex items-center justify-center gap-2 rounded-full bg-[#d3ee9c] px-4 py-3 text-sm font-semibold text-[#182011]">+ Add wardrobe pieces</Link></nav></div> : null}
    </header>
  );
}
