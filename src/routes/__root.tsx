import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { PublicEngagementLayer } from "@/components/PublicEngagementLayer";
import { CookieConsentManager } from "@/components/cookies/CookieConsentUI";
import { CookieConsentProvider } from "@/lib/cookie-consent";
import { SITE_ORIGIN, socialImageMeta } from "@/lib/seo";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RebateBoard | Trade Smarter. Earn Cashback. Choose Trusted Brands." },
      { name: "description", content: "Discover trusted brokers, prop firms, and exchanges. Earn cashback, compare TBI trust scores, read verified reviews, track performance, and sharpen your edge with Rebeta AI." },
      { name: "author", content: "RebateBoard" },
      { property: "og:title", content: "RebateBoard | Trade Smarter. Earn Cashback. Choose Trusted Brands." },
      { property: "og:description", content: "Discover trusted brokers, prop firms, and exchanges. Earn cashback, compare TBI trust scores, read verified reviews, track performance, and sharpen your edge with Rebeta AI." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_ORIGIN },
      { property: "og:site_name", content: "RebateBoard" },
      ...socialImageMeta(),
      { name: "twitter:site", content: "@RebateBoard" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: SITE_ORIGIN },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/favicon.png" },
      { rel: "shortcut icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", sizes: "512x512", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <I18nProvider>
      <AuthProvider>
        <CookieConsentProvider>
          <Outlet />
          <PublicEngagementLayer />
          <CookieConsentManager />
        </CookieConsentProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
