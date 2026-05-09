import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { LEGAL_DOCS } from "@/lib/legal-content";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScrollText, Shield, Cookie, AlertTriangle, BadgeCheck, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/legal")({
  component: LegalLayout,
});

const ICONS = {
  terms: ScrollText,
  privacy: Shield,
  cookies: Cookie,
  disclaimer: AlertTriangle,
  compliance: BadgeCheck,
} as const;

function LegalLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Soft gradient background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(217,70,239,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(124,58,237,0.18),_transparent_50%)]"
      />
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <SiteHeader />

        <div className="mt-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white">
            <ArrowLeft className="h-3 w-3" /> Back to home
          </Link>
        </div>

        <div className="mt-4 grid gap-6 pb-16 lg:grid-cols-[260px_1fr]">
          {/* Sticky sidebar */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <nav className="glass rounded-2xl p-3 ring-1 ring-white/10">
              <div className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Legal Center
              </div>
              <ul className="space-y-1">
                {LEGAL_DOCS.map((doc) => {
                  const Icon = ICONS[doc.slug];
                  const href = `/legal/${doc.slug}`;
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <li key={doc.slug}>
                      <Link
                        to={href}
                        className={
                          "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition " +
                          (active
                            ? "bg-gradient-to-r from-fuchsia-500/20 to-violet-500/20 text-white ring-1 ring-fuchsia-300/30"
                            : "text-white/70 hover:bg-white/5 hover:text-white")
                        }
                      >
                        <Icon className={"h-3.5 w-3.5 " + (active ? "text-fuchsia-300" : "text-muted-foreground")} />
                        {doc.navLabel}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Have a compliance concern? Email{" "}
                  <a className="text-fuchsia-300 hover:underline" href="mailto:compliance@rebateboard.com">
                    compliance@rebateboard.com
                  </a>
                </p>
              </div>
            </nav>
          </aside>

          {/* Content area */}
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
