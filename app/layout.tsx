import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Job Finder", description: "Daily job matches, tailored resumes, application tracking" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  return (
    <html lang="en">
      <body>
        {data.user && (
          <header className="no-print border-b border-slate-200 bg-white">
            <nav className="mx-auto flex max-w-6xl items-center gap-5 px-4 py-3 text-sm">
              <Link href="/" className="font-bold">Job Finder</Link>
              <Link href="/jobs" className="text-slate-600 hover:text-slate-900">Matches</Link>
              <Link href="/applications" className="text-slate-600 hover:text-slate-900">Applications</Link>
              <Link href="/profile" className="text-slate-600 hover:text-slate-900">Profile</Link>
              <form action={signOut} className="ml-auto"><button className="text-slate-500 hover:text-slate-900">Sign out</button></form>
            </nav>
          </header>
        )}
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
