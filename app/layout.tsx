import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "./globals.css";
import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = { title: "Job Finder", description: "Daily job matches, tailored resumes, application tracking" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  return (
    <html lang="en">
      <body>
        {data.user ? (
          <div className="lg:grid lg:grid-cols-[232px_1fr]">
            <Nav email={data.user.email ?? ""} />
            <main className="mx-auto w-full max-w-5xl px-5 py-8 lg:px-10 lg:py-10">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
