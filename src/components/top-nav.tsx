"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Overview", icon: "⌂" },
  { href: "/upload", label: "My closet", icon: "▦" },
  { href: "/suggestions", label: "Outfit lab", icon: "✳" },
  { href: "/chat", label: "Stylist", icon: "✧" },
  { href: "/settings", label: "Preferences", icon: "⚙" },
];
function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}
export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const isPublicPath = pathname === "/";

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#11140f]/90 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-10">
        <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="FitMatch AI home">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#d3ee9c] text-sm font-black tracking-[-0.08em] text-[#182011]">FM</span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-bold tracking-[0.13em] text-[#f4f2e9]">FITMATCH</span>
            <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-500">Wardrobe intelligence</span>
          </span>
        </Link>
        {!isPublicPath ? (
          <nav aria-label="Primary navigation" className="hidden items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.025] p-1 md:flex">
            {links.map((link) => {
              const active = isActivePath(pathname, link.href);
              return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}
                className={"rounded-full px-4 py-2 text-xs font-medium transition " +
                  (active ? "bg-[#d3ee9c] text-[#182011] shadow-sm" : "text-zinc-400 hover:bg-white/[0.07] hover:text-white")}>
                {link.label}
              </Link>;
            })}
          </nav>
        ) : <div className="hidden md:block" />}
        <div className="flex shrink-0 items-center gap-2">
          {isPublicPath ? (
            <>
              <Link href="/login" className="rounded-full border border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition hover:border-white/25 hover:text-white">Sign in</Link>
              <Link href="/signup" className="rounded-full bg-[#d3ee9c] px-4 py-2.5 text-xs font-semibold text-[#182011] transition hover:bg-[#e0f5b8]">Get started</Link>
            </>
          ) : (
            <>
              <Link href="/upload" className="hidden items-center gap-2 rounded-full border border-[#d3ee9c]/25 bg-[#d3ee9c]/[0.08] px-4 py-2.5 text-xs font-semibold text-[#d3ee9c] transition hover:border-[#d3ee9c]/50 hover:bg-[#d3ee9c]/[0.14] sm:inline-flex">+ Add pieces</Link>
              <button type="button" onClick={() => void handleSignOut()} disabled={signingOut}
                className="hidden rounded-full border border-white/10 px-3.5 py-2.5 text-xs text-zinc-400 transition hover:border-white/25 hover:text-white sm:inline-flex disabled:opacity-50">
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          )}
          <button type="button" aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen} onClick={() => setMobileOpen((previous) => !previous)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-white/10 text-zinc-200 transition hover:bg-white/10 md:hidden">
            <span className={"block h-0.5 w-4 rounded bg-current transition-all " + (mobileOpen ? "translate-y-2 rotate-45" : "")} />
            <span className={"block h-0.5 w-4 rounded bg-current transition-all " + (mobileOpen ? "opacity-0" : "")} />
            <span className={"block h-0.5 w-4 rounded bg-current transition-all " + (mobileOpen ? "-translate-y-2 -rotate-45" : "")} />
          </button>
        </div>
      </div>
      {mobileOpen ? (
        <div className="border-t border-white/[0.08] bg-[#11140f] px-4 pb-4 pt-3 md:hidden">
          <nav aria-label="Mobile navigation" className="mx-auto grid max-w-[1440px] gap-1 sm:px-2">
            {isPublicPath ? (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="mt-2 rounded-full border border-white/10 px-4 py-3 text-center text-sm font-semibold text-zinc-200">Sign in</Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className="rounded-full bg-[#d3ee9c] px-4 py-3 text-center text-sm font-semibold text-[#182011]">Create account</Link>
              </>
            ) : (
              <>
                {links.map((link) => {
                  const active = isActivePath(pathname, link.href);
                  return <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={"flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition " +
                      (active ? "bg-[#d3ee9c] font-semibold text-[#182011]" : "text-zinc-300 hover:bg-white/[0.06]")}>
                    <span className="w-5 text-center text-base" aria-hidden="true">{link.icon}</span>{link.label}
                  </Link>;
                })}
                <Link href="/upload" onClick={() => setMobileOpen(false)}
                  className="mt-2 flex items-center justify-center gap-2 rounded-full bg-[#d3ee9c] px-4 py-3 text-sm font-semibold text-[#182011]">+ Add wardrobe pieces</Link>
                <button type="button" onClick={() => void handleSignOut()}
                  className="mt-1 rounded-full border border-white/10 px-4 py-3 text-left text-sm text-zinc-400 transition hover:bg-white/[0.06] hover:text-white">Sign out</button>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
