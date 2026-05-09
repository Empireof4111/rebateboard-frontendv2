/**
 * Brand-side mock auth — separate from user auth.
 * Each "brand session" is keyed to a TBI brand slug. Lets the same browser
 * sign in as a brand for the /brand dashboard preview.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { TBI_BRANDS, type TBIBrand } from "./tbi-data";

const KEY = "rb_brand_session_v1";

type BrandSession = {
  slug: string;
  brandName: string;
  contactEmail: string;
  role: "owner" | "manager" | "support";
};

type Ctx = {
  session: BrandSession | null;
  brand: TBIBrand | null;
  signIn: (slug: string, email?: string) => void;
  signOut: () => void;
  loading: boolean;
};

const BrandAuthContext = createContext<Ctx | null>(null);

export function BrandAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<BrandSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setSession(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const signIn = (slug: string, email?: string) => {
    const b = TBI_BRANDS.find((x) => x.slug === slug);
    if (!b) return;
    const s: BrandSession = {
      slug: b.slug,
      brandName: b.name,
      contactEmail: email ?? `team@${b.website}`,
      role: "owner",
    };
    setSession(s);
    if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(s));
  };

  const signOut = () => {
    setSession(null);
    if (typeof window !== "undefined") localStorage.removeItem(KEY);
  };

  const brand = session ? TBI_BRANDS.find((b) => b.slug === session.slug) ?? null : null;

  return (
    <BrandAuthContext.Provider value={{ session, brand, signIn, signOut, loading }}>
      {children}
    </BrandAuthContext.Provider>
  );
}

export function useBrandAuth() {
  const ctx = useContext(BrandAuthContext);
  if (!ctx) throw new Error("useBrandAuth must be used inside BrandAuthProvider");
  return ctx;
}
