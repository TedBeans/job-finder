"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions";

const I = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  find: "M21 21l-4.3-4.3M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  matches: "M4 6h16M4 12h16M4 18h10",
  apps: "M4 4h5v16H4zM11 4h5v10h-5zM18 4h2v6h-2z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};
const items = [
  { href: "/", label: "Home", icon: I.home },
  { href: "/agent", label: "Find jobs", icon: I.find },
  { href: "/jobs", label: "Matches", icon: I.matches },
  { href: "/applications", label: "Applications", icon: I.apps },
  { href: "/profile", label: "Profile", icon: I.user },
];

export function Nav({ email }: { email: string }) {
  const path = usePathname();
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  return (
    <aside className="no-print border-b border-line bg-canvas px-4 py-3 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <div className="flex items-center justify-between lg:mb-8">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-sm text-white">J</span>
          Job Finder
        </Link>
        <form action={signOut} className="lg:hidden"><button className="text-sm font-semibold text-muted hover:text-ink">Sign out</button></form>
      </div>
      <nav className="mt-3 flex gap-1 overflow-x-auto lg:mt-0 lg:flex-col" aria-label="Main">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active(it.href) ? "page" : undefined}
            className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition ${active(it.href) ? "bg-white text-brand shadow-[0_1px_0_var(--color-line)]" : "text-muted hover:text-ink"}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={it.icon} /></svg>
            {it.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto hidden border-t border-line pt-4 lg:block">
        <p className="truncate text-sm text-muted">{email}</p>
        <form action={signOut}><button className="mt-1 text-sm font-semibold text-ink hover:text-brand">Sign out</button></form>
      </div>
    </aside>
  );
}
