import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel } from "@/components/superadmin/AdminUI";
import { toast } from "@/components/superadmin/AdminActions";
import { createAdminBrand, fetchAdminBrands, updateAdminBrand, type AdminBrandRecord } from "@/lib/admin-brands-api";
import { uploadMediaFile, uploadMediaFiles } from "@/lib/media-api";
import {
  ArrowLeft, Save, Upload, Plus, Trash2, Copy, X,
  IdCard, Users, Briefcase, BookOpen, Wallet, ListChecks, Shield, Search, Image as ImageIcon, Eye, Check,
} from "lucide-react";

/* =====================================================================
 * Types
 * ===================================================================== */
type ChallengeRow = {
  id: string;
  program: "1-Step" | "2-Step" | "Instant";
  size: "5K" | "10K" | "25K" | "50K" | "100K" | "200K" | "300K";
  asset: "FX" | "Futures" | "Crypto";
  profitTarget: string;
  dailyLoss: string;
  maxLoss: string;
  ptdd: string;
  profitSplit: number | "";
  payoutFreq: string;
  rrPoints: number | "";
  price: number | "";
  originalPrice: number | "";
  badge?: "" | "Top" | "New" | "Best Value";
  discountCode?: string;
  active: boolean;
};

type AccountStep = { id: string; title: string; body: string };

const newChallenge = (): ChallengeRow => ({
  id: `ch_${Math.random().toString(36).slice(2, 8)}`,
  program: "2-Step", size: "100K", asset: "FX",
  profitTarget: "", dailyLoss: "", maxLoss: "",
  ptdd: "", profitSplit: "", payoutFreq: "",
  rrPoints: "", price: "", originalPrice: "", badge: "", discountCode: "", active: true,
});

const newStep = (title = ""): AccountStep => ({
  id: `st_${Math.random().toString(36).slice(2, 8)}`,
  title,
  body: "",
});

type BrandEditorSearch = {
  brandId?: string;
  section?: SectionId;
};

export const Route = createFileRoute("/superadmin/brands_/new")({
  validateSearch: (search: Record<string, unknown>): BrandEditorSearch => ({
    brandId: typeof search.brandId === "string" && search.brandId ? search.brandId : undefined,
    section: typeof search.section === "string" ? search.section as SectionId : undefined,
  }),
  component: NewBrandPage,
});

type Category =
  | "Forex Broker" | "Prop Firm" | "Futures Prop Firm" | "Crypto Prop Firm" | "Stock Prop Firm" | "DEX Prop Firm"
  | "Crypto Exchange" | "Trading Software" | "Education Provider" | "Other";

const CATEGORIES: Category[] = [
  "Forex Broker", "Prop Firm", "Futures Prop Firm", "Crypto Prop Firm", "Stock Prop Firm", "DEX Prop Firm",
  "Crypto Exchange", "Trading Software", "Education Provider", "Other",
];

function Field({ label, children, span = 1, hint }: { label: string; children: React.ReactNode; span?: 1 | 2; hint?: string }) {
  return (
    <div className={span === 2 ? "md:col-span-2" : ""}>
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[10px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:ring-fuchsia-400/40 focus:outline-none placeholder:text-muted-foreground";
const selectCls = `${inputCls} bg-slate-950 [color-scheme:dark] [&>option]:bg-slate-950 [&>option]:text-white`;

/* =====================================================================
 * Section IDs — one per left-rail item
 * ===================================================================== */
type SectionId =
  | "category" | "identity" | "founder" | "specifics" | "editorial" | "profile"
  | "cashback" | "challenges" | "assets" | "trust" | "seo" | "visibility";

type WizardState = {
  lastSection?: SectionId;
  savedSections?: SectionId[];
};

type BrandFlags = {
  inTbi: boolean;
  cashbackEligible: boolean;
  featured: boolean;
  __wizard?: WizardState;
};

function NewBrandPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/superadmin/brands_/new" }) as BrandEditorSearch;
  const editingBrandId = search.brandId;
  const [saving, setSaving] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [savedSections, setSavedSections] = useState<SectionId[]>([]);
  const [assetUploading, setAssetUploading] = useState<null | "logo" | "cover" | "screenshots" | "kyb">(null);

  /* ---- form state (everything wired) ---- */
  const [category, setCategory] = useState<Category>("Prop Firm");
  const [visibility, setVisibility] = useState<"draft" | "published" | "hidden" | "archived">("draft");
  const [section, setSection] = useState<SectionId>("category");

  // Identity
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [founded, setFounded] = useState("");
  const [hq, setHq] = useState("");
  const [website, setWebsite] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [editorial, setEditorial] = useState("");

  // Founder
  const [ceo, setCeo] = useState("");
  const [founderLi, setFounderLi] = useState("");
  const [founderX, setFounderX] = useState("");
  const [yt, setYt] = useState("");
  const [tags, setTags] = useState("");

  // Specifics — broker
  const [broker, setBroker] = useState({
    regulations: "", minDeposit: "", maxLeverage: "", platforms: "", assets: "",
    spreads: "", commission: "", accountTypes: "", deposits: "", withdrawals: "",
    withdrawalSpeed: "", execution: "", scalping: "Yes", hedging: "Yes",
    copyTrading: "Supported", islamic: "Available", restrictedCountries: "",
  });

  // Specifics — prop
  const [prop, setProp] = useState({
    evalType: "2-step", sizes: "", pricing: "", discountCode: "", profitSplit: "",
    profitTarget: "", dailyDD: "", maxDD: "", minDays: "", payoutSchedule: "",
    payoutMethods: "", scaling: "", maxAlloc: "", platform: "", instruments: "",
    news: "Allowed", weekend: "Allowed", ea: "Allowed", copyTrading: "Allowed",
    consistency: "", prohibited: "",
  });

  // Specifics — exchange
  const [exch, setExch] = useState({
    supportedAssets: "", fees: "", spot: "Yes", futures: "Yes", copyTrading: "Yes",
    kyc: "", deposits: "", withdrawals: "", security: "", licenses: "", referral: "",
  });

  // Specifics — tool
  const [tool, setTool] = useState({
    type: "", pricing: "", trial: "Yes", platforms: "", integrations: "",
    discountCode: "", features: "", bestFor: "",
  });

  // Editorial
  const [edStruct, setEdStruct] = useState({
    keyFeatures: "", tradingConditions: "", pros: "", cons: "", bestFor: "", verdict: "",
  });

  // Cashback / rebate
  const [cb, setCb] = useState({
    eligible: "Yes",
    type: "Broker trading rebate",
    defaultPct: 50,
    maxPct: 80,
    howRBEarns: "",
    howTraderEarns: "",
    terms: "",
    note: "", // moved from editorial
    // === payout flow ===
    supportsApiAuto: false,            // brand exposes API → auto credit
    supportsRebateWallet: true,        // can route into our internal Rebate wallet (was: revete)
    requiresManualClaim: true,         // forces proof-upload flow
    proofRequired: {                   // which proof fields trader must submit
      screenshot: true,
      registeredEmail: true,
      accountId: true,
      orderId: false,
    },
  });
  const [linkSteps, setLinkSteps] = useState<AccountStep[]>([]);
  const [createSteps, setCreateSteps] = useState<AccountStep[]>([]);

  // Challenges
  const [challenges, setChallenges] = useState<ChallengeRow[]>([newChallenge()]);

  // Assets
  const [logo, setLogo] = useState<string>("");
  const [cover, setCover] = useState<string>("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [primaryColor, setPrimaryColor] = useState("#7c3aed");

  // Trust
  const [tbi, setTbi] = useState<number>(80);
  const [licenseNo, setLicenseNo] = useState("");
  const [kybDoc, setKybDoc] = useState<string>("");

  // SEO
  const [seo, setSeo] = useState({ title: "", description: "" });

  // Public profile content (drives the brand profile page tabs)
  const [profile, setProfile] = useState({
    // Account option / instruments
    leverageOverall: "",
    leverageByAsset: "",            // "Forex 1:30, Indices 1:20, Metals 1:20"
    timeLimit: "",
    overnightHolding: "Allowed",
    // Customer support
    supportChannels: "Email, Helpdesk, Discord",
    supportResponse: "Fast (typically <24h)",
    supportCommunity: "Active Discord group with staff engagement",
    // Restricted countries (universal — comma list of ISO codes or names)
    restrictedCountries: "",
    // Regulation & Trust extras
    legalEntity: "",
    transparencyNote: "Terms and FAQs well-documented",
    publicFeedback: "Positive Trustpilot and Discord scores",
  });

  // Visibility flags
  const [flags, setFlags] = useState<BrandFlags>({ inTbi: true, cashbackEligible: true, featured: false });

  /* ---- derived ---- */
  const isBroker = category === "Forex Broker";
  const isProp =
    category === "Prop Firm" ||
    category === "Futures Prop Firm" ||
    category === "Crypto Prop Firm" ||
    category === "Stock Prop Firm" ||
    category === "DEX Prop Firm";
  const isExchange = category === "Crypto Exchange";
  const isTool = category === "Trading Software" || category === "Trading Tool";

  const sections = useMemo(() => {
    const base: { id: SectionId; label: string; icon: typeof IdCard; show: boolean }[] = [
      { id: "category",   label: "Category",       icon: ListChecks, show: true },
      { id: "identity",   label: "Identity",       icon: IdCard,     show: true },
      { id: "founder",    label: "Founder & Social", icon: Users,    show: true },
      { id: "specifics",  label: isBroker ? "Broker specifics" : isProp ? "Prop firm specifics" : isExchange ? "Exchange specifics" : isTool ? "Tool specifics" : "Specifics", icon: Briefcase, show: isBroker || isProp || isExchange || isTool },
      { id: "editorial",  label: "Editorial review", icon: BookOpen, show: true },
      { id: "profile",    label: "Profile content", icon: BookOpen, show: true },
      { id: "cashback",   label: "Cashback / Rebate", icon: Wallet, show: true },
      { id: "challenges", label: `Challenges (${challenges.length})`, icon: ListChecks, show: isProp },
      { id: "assets",     label: "Brand assets",   icon: ImageIcon,  show: true },
      { id: "trust",      label: "Trust & TBI",    icon: Shield,     show: true },
      { id: "seo",        label: "SEO",            icon: Search,     show: true },
      { id: "visibility", label: "Visibility",     icon: Eye,        show: true },
    ];
    return base.filter((s) => s.show);
  }, [isBroker, isProp, isExchange, isTool, challenges.length]);

  // Track completed sections (simple heuristic per section)
  const sectionReady = useMemo<Record<SectionId, boolean>>(() => ({
    category: !!category,
    identity: !!name.trim(),
    founder: !!(ceo || founderLi || tags),
    specifics:
      (isBroker && !!broker.regulations) ||
      (isProp && !!prop.profitTarget) ||
      (isExchange && !!exch.supportedAssets) ||
      (isTool && !!tool.type) || (!isBroker && !isProp && !isExchange && !isTool),
    editorial: !!(edStruct.keyFeatures || edStruct.verdict),
    profile: !!(profile.supportChannels || profile.legalEntity),
    cashback: !!cb.howTraderEarns || (isBroker && (linkSteps.some((s) => s.title || s.body) || createSteps.some((s) => s.title || s.body))),
    challenges: challenges.length > 0,
    assets: !!logo,
    trust: tbi > 0,
    seo: !!seo.title,
    visibility: true,
  }), [category, name, ceo, founderLi, tags, isBroker, broker, isProp, prop, isExchange, exch, isTool, tool, edStruct, profile, cb, linkSteps, createSteps, challenges.length, logo, tbi, seo.title]);

  const activeSections = useMemo(() => sections.map((item) => item.id), [sections]);

  function getNextSection(from: SectionId) {
    const index = activeSections.indexOf(from);
    return index >= 0 && index < activeSections.length - 1 ? activeSections[index + 1] : from;
  }

  function getFirstIncompleteSection() {
    return activeSections.find((id) => !sectionReady[id]) ?? activeSections[0] ?? "category";
  }

  function normalizeSavedSections(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is SectionId => typeof item === "string" && activeSections.includes(item as SectionId));
  }

  function isSectionId(value: unknown): value is SectionId {
    return typeof value === "string" && activeSections.includes(value as SectionId);
  }

  function hydrateFromBrand(brand: AdminBrandRecord) {
    setCategory(brand.category as Category);
    setVisibility(brand.visibility);
    setName(brand.name ?? "");
    setSlug(brand.slug ?? "");
    setWebsite(brand.website ?? "");
    setPrimaryColor(brand.primaryColor ?? "#7c3aed");
    setLogo(brand.thumbnail ?? "");
    setCover(brand.cover ?? "");
    setScreenshots(Array.isArray(brand.screenshots) ? brand.screenshots : []);
    setTbi(typeof brand.tbi === "number" ? brand.tbi : 80);

    const identity = (brand.identity ?? {}) as Record<string, string>;
    setFounded(String(identity.founded ?? ""));
    setHq(String(identity.hq ?? ""));
    setSupportEmail(String(identity.supportEmail ?? ""));
    setTagline(String(identity.tagline ?? ""));
    setDescription(String(identity.description ?? ""));
    setEditorial(String(identity.editorial ?? ""));

    const founder = (brand.founder ?? {}) as Record<string, string>;
    setCeo(String(founder.ceo ?? ""));
    setFounderLi(String(founder.founderLi ?? ""));
    setFounderX(String(founder.founderX ?? ""));
    setYt(String(founder.yt ?? ""));
    setTags(String(founder.tags ?? ""));

    setBroker({
      regulations: "", minDeposit: "", maxLeverage: "", platforms: "", assets: "",
      spreads: "", commission: "", accountTypes: "", deposits: "", withdrawals: "",
      withdrawalSpeed: "", execution: "", scalping: "Yes", hedging: "Yes",
      copyTrading: "Supported", islamic: "Available", restrictedCountries: "",
      ...((brand.broker ?? {}) as Record<string, string>),
    });
    setProp({
      evalType: "2-step", sizes: "", pricing: "", discountCode: "", profitSplit: "",
      profitTarget: "", dailyDD: "", maxDD: "", minDays: "", payoutSchedule: "",
      payoutMethods: "", scaling: "", maxAlloc: "", platform: "", instruments: "",
      news: "Allowed", weekend: "Allowed", ea: "Allowed", copyTrading: "Allowed",
      consistency: "", prohibited: "",
      ...((brand.prop ?? {}) as Record<string, string>),
    });
    setExch({
      supportedAssets: "", fees: "", spot: "Yes", futures: "Yes", copyTrading: "Yes",
      kyc: "", deposits: "", withdrawals: "", security: "", licenses: "", referral: "",
      ...((brand.exchange ?? {}) as Record<string, string>),
    });
    setTool({
      type: "", pricing: "", trial: "Yes", platforms: "", integrations: "",
      discountCode: "", features: "", bestFor: "",
      ...((brand.tool ?? {}) as Record<string, string>),
    });

    setEdStruct({
      keyFeatures: "", tradingConditions: "", pros: "", cons: "", bestFor: "", verdict: "",
      ...((brand.editorial ?? {}) as Record<string, string>),
    });
    setProfile({
      leverageOverall: "",
      leverageByAsset: "",
      timeLimit: "",
      overnightHolding: "Allowed",
      supportChannels: "Email, Helpdesk, Discord",
      supportResponse: "Fast (typically <24h)",
      supportCommunity: "Active Discord group with staff engagement",
      restrictedCountries: "",
      legalEntity: "",
      transparencyNote: "Terms and FAQs well-documented",
      publicFeedback: "Positive Trustpilot and Discord scores",
      ...((brand.profile ?? {}) as Record<string, string>),
    });

    const cashback = (brand.cashback ?? {}) as Record<string, unknown>;
    setCb({
      eligible: String(cashback.eligible ?? "Yes"),
      type: String(cashback.type ?? "Broker trading rebate"),
      defaultPct: Number(cashback.defaultPct ?? 50),
      maxPct: Number(cashback.maxPct ?? 80),
      howRBEarns: String(cashback.howRBEarns ?? ""),
      howTraderEarns: String(cashback.howTraderEarns ?? ""),
      terms: String(cashback.terms ?? ""),
      note: String(cashback.note ?? ""),
      supportsApiAuto: Boolean(cashback.supportsApiAuto),
      supportsRebateWallet: cashback.supportsRebateWallet == null ? true : Boolean(cashback.supportsRebateWallet),
      requiresManualClaim: cashback.requiresManualClaim == null ? true : Boolean(cashback.requiresManualClaim),
      proofRequired: {
        screenshot: Boolean((cashback.proofRequired as Record<string, unknown> | undefined)?.screenshot ?? true),
        registeredEmail: Boolean((cashback.proofRequired as Record<string, unknown> | undefined)?.registeredEmail ?? true),
        accountId: Boolean((cashback.proofRequired as Record<string, unknown> | undefined)?.accountId ?? true),
        orderId: Boolean((cashback.proofRequired as Record<string, unknown> | undefined)?.orderId ?? false),
      },
    });
    setLinkSteps(Array.isArray(cashback.linkSteps) ? (cashback.linkSteps as AccountStep[]) : []);
    setCreateSteps(Array.isArray(cashback.createSteps) ? (cashback.createSteps as AccountStep[]) : []);
    setChallenges(Array.isArray(brand.challenges) && brand.challenges.length ? (brand.challenges as ChallengeRow[]) : [newChallenge()]);

    const trust = (brand.trust ?? {}) as Record<string, string | number>;
    setLicenseNo(String(trust.licenseNo ?? ""));
    setKybDoc(String(trust.kybDoc ?? ""));

    const seoValue = (brand.seo ?? {}) as Record<string, string>;
    setSeo({
      title: String(seoValue.title ?? ""),
      description: String(seoValue.description ?? ""),
    });

    const flagsValue = (brand.flags ?? {}) as Record<string, unknown>;
    const wizard = (flagsValue.__wizard ?? {}) as WizardState;
    setFlags({
      inTbi: flagsValue.inTbi == null ? true : Boolean(flagsValue.inTbi),
      cashbackEligible: flagsValue.cashbackEligible == null ? true : Boolean(flagsValue.cashbackEligible),
      featured: Boolean(flagsValue.featured),
      __wizard: {
        lastSection: isSectionId(wizard.lastSection) ? wizard.lastSection : undefined,
        savedSections: normalizeSavedSections(wizard.savedSections),
      },
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadDraft() {
      if (!editingBrandId) return;
      setLoadingDraft(true);
      try {
        const brands = await fetchAdminBrands();
        const brand = brands.find((item) => item.id === editingBrandId);
        if (!brand) {
          toast.error("Draft brand not found");
          navigate({ to: "/superadmin/brands" });
          return;
        }
        if (cancelled) return;
        hydrateFromBrand(brand);
        const wizard = ((brand.flags ?? {}) as Record<string, unknown>).__wizard as WizardState | undefined;
        const persistedSaved = normalizeSavedSections(wizard?.savedSections);
        const firstIncomplete = activeSections.find((id) => !sectionReady[id]);
        const inferredSaved = firstIncomplete
          ? activeSections.slice(0, Math.max(0, activeSections.indexOf(firstIncomplete)))
          : activeSections;
        setSavedSections(persistedSaved.length ? persistedSaved : inferredSaved);
      } catch (ex) {
        if (!cancelled) {
          toast.error(ex instanceof Error ? ex.message : "Unable to load draft brand");
        }
      } finally {
        if (!cancelled) setLoadingDraft(false);
      }
    }

    void loadDraft();
    return () => {
      cancelled = true;
    };
  }, [editingBrandId]);

  useEffect(() => {
    if (loadingDraft) return;
    if (search.section && activeSections.includes(search.section)) {
      setSection(search.section);
      return;
    }
    const persistedSection = flags.__wizard?.lastSection;
    if (editingBrandId && persistedSection && activeSections.includes(persistedSection)) {
      setSection(persistedSection);
      return;
    }
    if (editingBrandId) {
      setSection(getFirstIncompleteSection());
    }
  }, [loadingDraft, search.section, editingBrandId, activeSections.join("|"), flags.__wizard?.lastSection, JSON.stringify(sectionReady)]);

  /* ---- save / persist ---- */
  const persistBrand = async (status: "draft" | "published" | "hidden" | "archived", options?: { advance?: boolean }) => {
    if (!name.trim()) {
      toast.error("Brand name is required");
      setSection("identity");
      return;
    }
    setSaving(true);
    try {
      const adminStatus = status === "published" ? "verified" : status === "draft" ? "draft" : "review";
      const nextSection = options?.advance ? getNextSection(section) : section;
      const nextSavedSections = Array.from(new Set([...savedSections, section].filter((item): item is SectionId => activeSections.includes(item))));
      const nextFlags: BrandFlags = {
        ...flags,
        __wizard: {
          lastSection: nextSection,
          savedSections: nextSavedSections,
        },
      };
      const newBrand = {
        name: name.trim(),
        slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, "-"),
        category,
        visibility: status,
        tbi,
        status: adminStatus,
        payouts: "—",
        complaints: 0,
        rankOverride: null,
        thumbnail: logo || undefined,
        cover: cover || undefined,
        screenshots,
        website: website || undefined,
        primaryColor,
        identity: { founded, hq, supportEmail, tagline, description, editorial },
        founder: { ceo, founderLi, founderX, yt, tags },
        broker: isBroker ? broker : undefined,
        prop: isProp ? prop : undefined,
        exchange: isExchange ? exch : undefined,
        tool: isTool ? tool : undefined,
        editorial: edStruct,
        profile,
        cashback: { ...cb, ...(isBroker ? { linkSteps, createSteps } : {}) },
        challenges: isProp ? challenges : undefined,
        trust: { tbi, licenseNo, kybDoc, legalEntity: profile.legalEntity, transparencyNote: profile.transparencyNote, publicFeedback: profile.publicFeedback },
        seo,
        flags: nextFlags,
      };
      const savedBrand = editingBrandId
        ? await updateAdminBrand(editingBrandId, newBrand)
        : await createAdminBrand(newBrand);
      setSavedSections(nextSavedSections);
      setFlags(nextFlags);
      setVisibility(status);
      toast.success(`Brand "${savedBrand.name}" saved as ${status}`);
      if (options?.advance) {
        setSection(nextSection);
        if (!editingBrandId) {
          navigate({
            to: "/superadmin/brands/new",
            search: { brandId: savedBrand.id, section: nextSection } as never,
            replace: true,
          });
        } else {
          navigate({
            to: "/superadmin/brands/new",
            search: { brandId: editingBrandId, section: nextSection } as never,
            replace: true,
          });
        }
        return;
      }
      navigate({ to: "/superadmin/brands" });
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Could not save brand");
    } finally {
      setSaving(false);
    }
  };

  function SectionActions() {
    return (
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => void persistBrand("draft")}
          disabled={saving}
          className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save draft"}
        </button>
        <button
          type="button"
          onClick={() => void persistBrand("draft", { advance: true })}
          disabled={saving}
          className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save & continue"}
        </button>
      </div>
    );
  }

  /* ---- challenge helpers ---- */
  const addChallenge = () => setChallenges((c) => [...c, newChallenge()]);
  const dupChallenge = (id: string) => setChallenges((c) => {
    const idx = c.findIndex((x) => x.id === id);
    if (idx < 0) return c;
    const copy = { ...c[idx], id: `ch_${Math.random().toString(36).slice(2, 8)}` };
    return [...c.slice(0, idx + 1), copy, ...c.slice(idx + 1)];
  });
  const rmChallenge = (id: string) => setChallenges((c) => c.filter((x) => x.id !== id));
  const patchChallenge = (id: string, patch: Partial<ChallengeRow>) =>
    setChallenges((c) => c.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  /* ---- step (account instructions) helpers ---- */
  const stepCtl = (which: "link" | "create") => {
    const get = which === "link" ? linkSteps : createSteps;
    const set = which === "link" ? setLinkSteps : setCreateSteps;
    return {
      list: get,
      add: () => set([...get, newStep()]),
      remove: (id: string) => set(get.filter((s) => s.id !== id)),
      patch: (id: string, p: Partial<AccountStep>) => set(get.map((s) => (s.id === id ? { ...s, ...p } : s))),
      move: (id: string, dir: -1 | 1) => {
        const idx = get.findIndex((s) => s.id === id);
        const j = idx + dir;
        if (idx < 0 || j < 0 || j >= get.length) return;
        const copy = [...get];
        [copy[idx], copy[j]] = [copy[j], copy[idx]];
        set(copy);
      },
    };
  };

  /* ---- file → data URL helper ---- */
  async function uploadSingleAsset(file: File, kind: "logo" | "cover" | "kyb", folder: string) {
    setAssetUploading(kind);
    try {
      const uploaded = await uploadMediaFile(file, {
        folder,
        prefix: slug.trim() || name.trim() || category.toLowerCase().replace(/\s+/g, "-"),
      });
      return uploaded.url;
    } finally {
      setAssetUploading(null);
    }
  }

  async function uploadScreenshotAssets(files: File[]) {
    setAssetUploading("screenshots");
    try {
      const uploaded = await uploadMediaFiles(files, {
        folder: "brands/screenshots",
        prefix: slug.trim() || name.trim() || category.toLowerCase().replace(/\s+/g, "-"),
      });
      return uploaded.map((item) => item.url);
    } finally {
      setAssetUploading(null);
    }
  }

  /* ===================================================================== */
  return (
    <div>
      <PageHeader
        title={editingBrandId ? `Edit Brand${name ? ` — ${name}` : ""}` : "Add a New Brand"}
        subtitle={editingBrandId
          ? "Open any section, update what you need, then save as draft or publish again."
          : "Pick a section on the left, fill it, then save. Form fields adapt to brand category."}
        actions={
          <>
            <Link to="/superadmin/brands" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Link>
            <button
              className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white disabled:opacity-60"
              onClick={() => void persistBrand("draft")}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save as draft"}
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              onClick={() => void persistBrand("published")}
              disabled={saving}
            >
              <Save className="h-3.5 w-3.5" /> {saving ? "Publishing..." : "Publish"}
            </button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        {/* Left rail — section nav */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl bg-white/5 p-2 ring-1 ring-white/10">
            <div className="px-2 pb-2 pt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Sections</div>
            <nav className="flex flex-col gap-0.5">
              {sections.map((s, i) => {
                const active = s.id === section;
                const done = savedSections.includes(s.id);
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSection(s.id)}
                    className={`group flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                      active ? "bg-gradient-to-r from-fuchsia-500/20 to-violet-600/20 text-white ring-1 ring-fuchsia-400/30" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className={`grid h-5 w-5 place-items-center rounded-md text-[10px] font-bold ${active ? "bg-fuchsia-500/30 text-fuchsia-100" : done ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-muted-foreground"}`}>
                      {done ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate font-semibold">{s.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-2 border-t border-white/10 pt-2">
              <p className="px-2 text-[10px] text-muted-foreground">Visibility: <span className="font-bold text-white">{visibility}</span></p>
            </div>
          </div>
        </aside>

        {/* Right pane — section content */}
        <div className="space-y-4">
          {loadingDraft && (
            <Panel title="Loading draft">
              <div className="py-6 text-sm text-muted-foreground">Loading saved brand data...</div>
            </Panel>
          )}
          {section === "category" && (
            <Panel title="Brand category">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`rounded-xl px-3 py-3 text-xs font-semibold ring-1 transition ${
                      category === c
                        ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white ring-transparent"
                        : "bg-white/5 text-muted-foreground ring-white/10 hover:text-white"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">Selected: <span className="font-bold text-fuchsia-300">{category}</span></p>
              <SectionActions />
            </Panel>
          )}

          {section === "identity" && (
            <Panel title="Identity">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Brand name"><input className={inputCls} placeholder="e.g. FundingPips" value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <Field label="Slug (URL)"><input className={inputCls} placeholder="fundingpips" value={slug} onChange={(e) => setSlug(e.target.value)} /></Field>
                <Field label="Founded year"><input className={inputCls} placeholder="2022" value={founded} onChange={(e) => setFounded(e.target.value)} /></Field>
                <Field label="Headquarters"><input className={inputCls} placeholder="Dubai, UAE" value={hq} onChange={(e) => setHq(e.target.value)} /></Field>
                <Field label="Website"><input className={inputCls} placeholder="https://…" value={website} onChange={(e) => setWebsite(e.target.value)} /></Field>
                <Field label="Support email"><input className={inputCls} placeholder="support@brand.com" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} /></Field>
                <Field label="Short tagline" span={2}><input className={inputCls} placeholder="One-line elevator pitch" value={tagline} onChange={(e) => setTagline(e.target.value)} /></Field>
                <Field label="Description" span={2}><textarea rows={3} className={inputCls} placeholder="Short overview shown on the brand card…" value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
                <Field label="Full editorial review" span={2}><textarea rows={6} className={inputCls} placeholder="RebateBoard's own long-form review…" value={editorial} onChange={(e) => setEditorial(e.target.value)} /></Field>
              </div>
              <SectionActions />
            </Panel>
          )}

          {section === "founder" && (
            <Panel title="Founder & social presence">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="CEO / founder name"><input className={inputCls} placeholder="John Doe" value={ceo} onChange={(e) => setCeo(e.target.value)} /></Field>
                <Field label="Founder LinkedIn"><input className={inputCls} placeholder="https://linkedin.com/in/…" value={founderLi} onChange={(e) => setFounderLi(e.target.value)} /></Field>
                <Field label="Founder X / Twitter"><input className={inputCls} placeholder="@handle" value={founderX} onChange={(e) => setFounderX(e.target.value)} /></Field>
                <Field label="YouTube review URL"><input className={inputCls} placeholder="https://youtube.com/…" value={yt} onChange={(e) => setYt(e.target.value)} /></Field>
                <Field label="Tags (comma-separated)" span={2}><input className={inputCls} placeholder="payouts, fast, regulated" value={tags} onChange={(e) => setTags(e.target.value)} /></Field>
              </div>
              <SectionActions />
            </Panel>
          )}

          {section === "specifics" && isBroker && (
            <Panel title="Broker-specific">
              <div className="grid gap-3 md:grid-cols-2">
                {([
                  ["regulations","Regulations / licenses","ASIC, FCA, CySEC"],
                  ["minDeposit","Min deposit","$100"],
                  ["maxLeverage","Max leverage","1:500"],
                  ["platforms","Trading platforms","MT4, MT5, cTrader"],
                  ["assets","Asset classes","Forex, Indices, Metals"],
                  ["spreads","Spreads from","0.0 pips"],
                  ["commission","Commission model","$3.5/lot round-turn"],
                  ["accountTypes","Account types","Standard, Raw, ECN"],
                  ["deposits","Deposit methods","Card, Wire, Crypto"],
                  ["withdrawals","Withdrawal methods","Crypto, Wire"],
                  ["withdrawalSpeed","Withdrawal speed","Within 24h"],
                  ["execution","Execution model","STP / ECN"],
                ] as const).map(([k, label, ph]) => (
                  <Field key={k} label={label}><input className={inputCls} placeholder={ph} value={(broker as any)[k]} onChange={(e) => setBroker({ ...broker, [k]: e.target.value })} /></Field>
                ))}
                {([
                  ["scalping","Scalping allowed",["Yes","No"]],
                  ["hedging","Hedging allowed",["Yes","No"]],
                  ["copyTrading","Copy trading",["Supported","Not supported"]],
                  ["islamic","Islamic account",["Available","Not available"]],
                ] as const).map(([k, label, opts]) => (
                  <Field key={k} label={label}>
                    <select className={selectCls} value={(broker as any)[k]} onChange={(e) => setBroker({ ...broker, [k]: e.target.value })}>
                      {opts.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                ))}
                <Field label="Restricted countries" span={2}><input className={inputCls} placeholder="US, IR, KP, …" value={broker.restrictedCountries} onChange={(e) => setBroker({ ...broker, restrictedCountries: e.target.value })} /></Field>
              </div>
              <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200 ring-1 ring-amber-400/20">
                Account-link / new-account step instructions live under <button onClick={() => setSection("cashback")} className="underline">Cashback / Rebate</button> — they're part of the redemption flow.
              </p>
              <SectionActions />
            </Panel>
          )}

          {section === "specifics" && isProp && (
            <Panel title="Prop firm-specific">
              <div className="grid gap-3 md:grid-cols-2">
                {([
                  ["pricing","Pricing","$59 – $1,899"],
                  ["discountCode","Discount code","REBATE25"],
                  ["profitSplit","Profit split","80% / 90% scaling"],
                  ["profitTarget","Profit target","8% / 5%"],
                  ["dailyDD","Daily drawdown","5%"],
                  ["maxDD","Max drawdown","10%"],
                  ["minDays","Min trading days","3"],
                  ["payoutSchedule","Payout schedule","Bi-weekly"],
                  ["payoutMethods","Payout methods","USDT, Wire, Rise"],
                  ["scaling","Scaling plan","+25% per 10% profit"],
                  ["maxAlloc","Max allocation","$2M"],
                  ["platform","Trading platform","MT4, MT5, cTrader, DXTrade"],
                ] as const).map(([k, label, ph]) => (
                  <Field key={k} label={label}><input className={inputCls} placeholder={ph} value={(prop as any)[k]} onChange={(e) => setProp({ ...prop, [k]: e.target.value })} /></Field>
                ))}
                <Field label="Allowed instruments" span={2}><input className={inputCls} placeholder="Forex, Indices, Metals, Crypto" value={prop.instruments} onChange={(e) => setProp({ ...prop, instruments: e.target.value })} /></Field>
                {([
                  ["news","News trading",["Allowed","Restricted","Not allowed"]],
                  ["weekend","Weekend holding",["Allowed","Not allowed"]],
                  ["ea","EA / bots",["Allowed","Restricted"]],
                  ["copyTrading","Copy trading",["Allowed","Not allowed"]],
                ] as const).map(([k, label, opts]) => (
                  <Field key={k} label={label}>
                    <select className={selectCls} value={(prop as any)[k]} onChange={(e) => setProp({ ...prop, [k]: e.target.value })}>
                      {opts.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                ))}
                <Field label="Consistency rule" span={2}><input className={inputCls} placeholder="Best day ≤ 40% of total profit" value={prop.consistency} onChange={(e) => setProp({ ...prop, consistency: e.target.value })} /></Field>
                <Field label="Prohibited strategies" span={2}><textarea rows={2} className={inputCls} placeholder="HFT, latency arbitrage, group trading…" value={prop.prohibited} onChange={(e) => setProp({ ...prop, prohibited: e.target.value })} /></Field>
              </div>
              <SectionActions />
            </Panel>
          )}

          {section === "specifics" && isExchange && (
            <Panel title="Exchange-specific">
              <div className="grid gap-3 md:grid-cols-2">
                {([
                  ["supportedAssets","Supported assets","500+ spot, 200+ perp"],
                  ["fees","Trading fees","0.10% maker / 0.10% taker"],
                  ["kyc","KYC requirements","Tiered KYC"],
                  ["deposits","Deposit methods","Crypto, Card, P2P, Bank"],
                  ["withdrawals","Withdrawal methods","Crypto, Bank"],
                ] as const).map(([k, l, p]) => (
                  <Field key={k} label={l}><input className={inputCls} placeholder={p} value={(exch as any)[k]} onChange={(e) => setExch({ ...exch, [k]: e.target.value })} /></Field>
                ))}
                {([
                  ["spot","Spot support"],["futures","Futures support"],["copyTrading","Copy trading"],
                ] as const).map(([k, l]) => (
                  <Field key={k} label={l}>
                    <select className={selectCls} value={(exch as any)[k]} onChange={(e) => setExch({ ...exch, [k]: e.target.value })}>
                      <option>Yes</option><option>No</option>
                    </select>
                  </Field>
                ))}
                <Field label="Security features" span={2}><input className={inputCls} placeholder="Cold storage, 2FA, withdrawal whitelist" value={exch.security} onChange={(e) => setExch({ ...exch, security: e.target.value })} /></Field>
                <Field label="Licenses / registrations" span={2}><input className={inputCls} placeholder="VARA Dubai, MAS Singapore, …" value={exch.licenses} onChange={(e) => setExch({ ...exch, licenses: e.target.value })} /></Field>
                <Field label="Referral / affiliate commission" span={2}><input className={inputCls} placeholder="Up to 60% trading fee share" value={exch.referral} onChange={(e) => setExch({ ...exch, referral: e.target.value })} /></Field>
              </div>
              <SectionActions />
            </Panel>
          )}

          {section === "specifics" && isTool && (
            <Panel title="Tool / software specific">
              <div className="grid gap-3 md:grid-cols-2">
                {([
                  ["type","Tool type","Charting, Journal, Bot, Indicator"],
                  ["pricing","Pricing","$29/mo or $299/yr"],
                  ["platforms","Supported platforms","Web, iOS, Android, MT5"],
                  ["integrations","Integrations","MT4, MT5, NinjaTrader"],
                  ["discountCode","Discount code","REBATE10"],
                ] as const).map(([k, l, p]) => (
                  <Field key={k} label={l}><input className={inputCls} placeholder={p} value={(tool as any)[k]} onChange={(e) => setTool({ ...tool, [k]: e.target.value })} /></Field>
                ))}
                <Field label="Free trial">
                  <select className={selectCls} value={tool.trial} onChange={(e) => setTool({ ...tool, trial: e.target.value })}>
                    <option>Yes</option><option>No</option>
                  </select>
                </Field>
                <Field label="Features" span={2}><textarea rows={2} className={inputCls} placeholder="Auto journal, advanced analytics, AI risk coach…" value={tool.features} onChange={(e) => setTool({ ...tool, features: e.target.value })} /></Field>
                <Field label="Best for" span={2}><textarea rows={2} className={inputCls} placeholder="Day traders, scalpers, prop traders…" value={tool.bestFor} onChange={(e) => setTool({ ...tool, bestFor: e.target.value })} /></Field>
              </div>
              <SectionActions />
            </Panel>
          )}

          {section === "editorial" && (
            <Panel title="Editorial review structure (renders on brand profile)">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Key features" span={2}><textarea rows={2} className={inputCls} placeholder="One per line" value={edStruct.keyFeatures} onChange={(e) => setEdStruct({ ...edStruct, keyFeatures: e.target.value })} /></Field>
                <Field label="Trading conditions" span={2}><textarea rows={2} className={inputCls} value={edStruct.tradingConditions} onChange={(e) => setEdStruct({ ...edStruct, tradingConditions: e.target.value })} /></Field>
                <Field label="Pros" span={2}><textarea rows={2} className={inputCls} placeholder="One per line" value={edStruct.pros} onChange={(e) => setEdStruct({ ...edStruct, pros: e.target.value })} /></Field>
                <Field label="Cons" span={2}><textarea rows={2} className={inputCls} placeholder="One per line" value={edStruct.cons} onChange={(e) => setEdStruct({ ...edStruct, cons: e.target.value })} /></Field>
                <Field label="Best for" span={2}><input className={inputCls} placeholder="Funded trader hunters, low-spread scalpers" value={edStruct.bestFor} onChange={(e) => setEdStruct({ ...edStruct, bestFor: e.target.value })} /></Field>
                <Field label="Final verdict" span={2}><textarea rows={3} className={inputCls} placeholder="One paragraph summary." value={edStruct.verdict} onChange={(e) => setEdStruct({ ...edStruct, verdict: e.target.value })} /></Field>
              </div>
              <SectionActions />
            </Panel>
          )}

          {section === "profile" && (
            <div className="space-y-4">
              {!isBroker && !isExchange && category !== "Trading Software" && category !== "Education Provider" && (
                <Panel title="Account option · instruments & leverage">
                  <p className="mb-3 text-[11px] text-muted-foreground">
                    These render on the brand profile under <span className="font-semibold text-white">Account Option</span> and <span className="font-semibold text-white">Supported Instrument &amp; Leverage</span>.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Overall leverage"><input className={inputCls} placeholder="1:30" value={profile.leverageOverall} onChange={(e) => setProfile({ ...profile, leverageOverall: e.target.value })} /></Field>
                    <Field label="Time limit"><input className={inputCls} placeholder="None" value={profile.timeLimit} onChange={(e) => setProfile({ ...profile, timeLimit: e.target.value })} /></Field>
                    <Field label="Leverage by asset" span={2} hint="Free text — e.g. Forex 1:30, Indices 1:20, Metals 1:20, Crypto 1:5">
                      <input className={inputCls} value={profile.leverageByAsset} onChange={(e) => setProfile({ ...profile, leverageByAsset: e.target.value })} />
                    </Field>
                    <Field label="Overnight holding">
                      <select className={selectCls} value={profile.overnightHolding} onChange={(e) => setProfile({ ...profile, overnightHolding: e.target.value })}>
                        <option>Allowed</option><option>Restricted</option><option>Not allowed</option>
                      </select>
                    </Field>
                  </div>
                </Panel>
              )}

              {!isExchange && category !== "Trading Software" && (
                <Panel title="Customer support">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Channels" span={2}><input className={inputCls} placeholder="Email, Helpdesk, Discord" value={profile.supportChannels} onChange={(e) => setProfile({ ...profile, supportChannels: e.target.value })} /></Field>
                    <Field label="Response time"><input className={inputCls} placeholder="Fast (<24h)" value={profile.supportResponse} onChange={(e) => setProfile({ ...profile, supportResponse: e.target.value })} /></Field>
                    <Field label="Community support"><input className={inputCls} placeholder="Active Discord with staff" value={profile.supportCommunity} onChange={(e) => setProfile({ ...profile, supportCommunity: e.target.value })} /></Field>
                  </div>
                </Panel>
              )}

              {category !== "Education Provider" && (
                <Panel title="Restricted countries">
                  <Field label="Country list (comma separated)" span={2} hint="ISO codes or country names — e.g. US, IR, KP, Cuba">
                    <textarea rows={3} className={inputCls} value={profile.restrictedCountries} onChange={(e) => setProfile({ ...profile, restrictedCountries: e.target.value })} />
                  </Field>
                </Panel>
              )}

              {!isBroker && category !== "Education Provider" && (
                <Panel title="Regulation & trust narrative">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Legal entity"><input className={inputCls} placeholder="CTI Group LTD" value={profile.legalEntity} onChange={(e) => setProfile({ ...profile, legalEntity: e.target.value })} /></Field>
                    <Field label="Transparency note"><input className={inputCls} value={profile.transparencyNote} onChange={(e) => setProfile({ ...profile, transparencyNote: e.target.value })} /></Field>
                    <Field label="Public feedback summary" span={2}><input className={inputCls} value={profile.publicFeedback} onChange={(e) => setProfile({ ...profile, publicFeedback: e.target.value })} /></Field>
                  </div>
                </Panel>
              )}
              <SectionActions />
            </div>
          )}

          {section === "cashback" && (
            <div className="space-y-4">
              <Panel title="Cashback / rebate setup">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Cashback eligible">
                    <select className={selectCls} value={cb.eligible} onChange={(e) => setCb({ ...cb, eligible: e.target.value })}>
                      <option>Yes</option><option>No</option>
                    </select>
                  </Field>
                  <Field label="Cashback type">
                    <select className={selectCls} value={cb.type} onChange={(e) => setCb({ ...cb, type: e.target.value })}>
                      <option>Broker trading rebate</option>
                      <option>Exchange trading rebate</option>
                      <option>Prop firm account-purchase cashback</option>
                      <option>Discount-only</option>
                      <option>Manual campaign</option>
                    </select>
                  </Field>
                  <Field label="Default cashback %"><input type="number" className={inputCls} placeholder="50" value={cb.defaultPct} onChange={(e) => setCb({ ...cb, defaultPct: Number(e.target.value) })} /></Field>
                  <Field label="Maximum cashback %"><input type="number" className={inputCls} placeholder="80" value={cb.maxPct} onChange={(e) => setCb({ ...cb, maxPct: Number(e.target.value) })} /></Field>
                  <Field label="How RebateBoard earns" span={2}><input className={inputCls} placeholder="IB / affiliate commission per lot or sale" value={cb.howRBEarns} onChange={(e) => setCb({ ...cb, howRBEarns: e.target.value })} /></Field>
                  <Field label="How trader earns" span={2}><input className={inputCls} placeholder="50% of commission, paid weekly to wallet" value={cb.howTraderEarns} onChange={(e) => setCb({ ...cb, howTraderEarns: e.target.value })} /></Field>
                  <Field label="Cashback note (internal)" span={2} hint="Internal note shown to admin staff only.">
                    <textarea rows={2} className={inputCls} value={cb.note} onChange={(e) => setCb({ ...cb, note: e.target.value })} />
                  </Field>
                  <Field label="Terms & conditions" span={2}><textarea rows={3} className={inputCls} value={cb.terms} onChange={(e) => setCb({ ...cb, terms: e.target.value })} /></Field>
                </div>
              </Panel>

              <Panel title="Payout flow & trader options">
                <p className="mb-3 text-[11px] text-muted-foreground">
                  Controls what payout choices the trader sees on the frontend when they earn cashback with this brand.
                  {(isBroker || isExchange)
                    ? " Brokers & Exchanges with API can auto-credit. Without API, trader must manually claim with proof."
                    : " Prop firms / Tools / Education default to manual claim with proof — turn on API auto-credit only if the partner exposes one."}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <ToggleField
                    label="Supports API auto-payout"
                    hint="Partner exposes an API to verify the trade/sale automatically — enables 'Auto credit to broker / Revete wallet'."
                    checked={cb.supportsApiAuto}
                    onChange={(v) => setCb({ ...cb, supportsApiAuto: v })}
                  />
                  <ToggleField
                    label="Supports payout to Rebate wallet"
                    hint="Allow routing the cashback into the trader's internal Rebate USD wallet."
                    checked={cb.supportsRebateWallet}
                    onChange={(v) => setCb({ ...cb, supportsRebateWallet: v })}
                  />
                  <ToggleField
                    label="Requires manual claim with proof"
                    hint="Force the proof-upload flow even if API exists. Recommended for prop firms / tools / education."
                    checked={cb.requiresManualClaim}
                    onChange={(v) => setCb({ ...cb, requiresManualClaim: v })}
                  />
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white">
                    Required proof fields (when claiming)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-white/85 md:grid-cols-4">
                    {([
                      ["screenshot", "Screenshot / receipt"],
                      ["registeredEmail", "Registered email"],
                      ["accountId", "Account ID"],
                      ["orderId", "Order / Tx ID"],
                    ] as const).map(([k, label]) => (
                      <label key={k} className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5">
                        <input
                          type="checkbox"
                          checked={cb.proofRequired[k]}
                          onChange={(e) => setCb({ ...cb, proofRequired: { ...cb.proofRequired, [k]: e.target.checked } })}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </Panel>

              {isBroker && (
                <>
                  <StepListPanel
                    title="Link an EXISTING account — step-by-step"
                    hint="Shown to traders who already have an account with this broker and want to attach it to their RebateBoard wallet."
                    ctl={stepCtl("link")}
                  />

                  <StepListPanel
                    title="Create a NEW account — step-by-step"
                    hint="Shown to traders signing up with this broker for the first time through your flow."
                    ctl={stepCtl("create")}
                  />
                </>
              )}
              <SectionActions />
            </div>
          )}

          {section === "challenges" && isProp && (
            <Panel
              title={`Challenges & accounts (${challenges.length})`}
              action={
                <button type="button" onClick={addChallenge} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-[11px] font-bold text-white">
                  <Plus className="h-3 w-3" /> Add challenge
                </button>
              }
            >
              <p className="mb-3 text-[11px] text-muted-foreground">
                Add as many challenge accounts as the firm offers — these render on the brand's frontend page exactly like FundingPips / FTMO challenge tables.
              </p>
              {challenges.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/5 p-6 text-center text-xs text-muted-foreground">
                  No challenges yet. Click <span className="font-bold text-white">+ Add challenge</span> to create the first one.
                </div>
              )}
              <div className="space-y-3">
                {challenges.map((c, i) => (
                  <div key={c.id} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-bold text-fuchsia-300 ring-1 ring-fuchsia-400/30">#{i + 1}</span>
                        <span className="text-xs font-bold text-white">{c.program} · {c.size} · {c.asset}</span>
                        <label className="ml-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <input type="checkbox" checked={c.active} onChange={(e) => patchChallenge(c.id, { active: e.target.checked })} /> Active
                        </label>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => dupChallenge(c.id)} title="Duplicate" className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white hover:bg-white/15"><Copy className="h-3 w-3" /></button>
                        <button type="button" onClick={() => rmChallenge(c.id)} title="Remove" className="grid h-7 w-7 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30 hover:bg-rose-500/25"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      <Field label="Program">
                        <select className={selectCls} value={c.program} onChange={(e) => patchChallenge(c.id, { program: e.target.value as ChallengeRow["program"] })}>
                          <option>1-Step</option><option>2-Step</option><option>Instant</option>
                        </select>
                      </Field>
                      <Field label="Account size">
                        <select className={selectCls} value={c.size} onChange={(e) => patchChallenge(c.id, { size: e.target.value as ChallengeRow["size"] })}>
                          <option>5K</option><option>10K</option><option>25K</option><option>50K</option><option>100K</option><option>200K</option><option>300K</option>
                        </select>
                      </Field>
                      <Field label="Asset class">
                        <select className={selectCls} value={c.asset} onChange={(e) => patchChallenge(c.id, { asset: e.target.value as ChallengeRow["asset"] })}>
                          <option>FX</option><option>Futures</option><option>Crypto</option>
                        </select>
                      </Field>
                      <Field label="Profit target"><input className={inputCls} value={c.profitTarget} onChange={(e) => patchChallenge(c.id, { profitTarget: e.target.value })} /></Field>
                      <Field label="Daily loss"><input className={inputCls} value={c.dailyLoss} onChange={(e) => patchChallenge(c.id, { dailyLoss: e.target.value })} /></Field>
                      <Field label="Max loss"><input className={inputCls} value={c.maxLoss} onChange={(e) => patchChallenge(c.id, { maxLoss: e.target.value })} /></Field>
                      <Field label="PT : DD ratio"><input className={inputCls} value={c.ptdd} onChange={(e) => patchChallenge(c.id, { ptdd: e.target.value })} /></Field>
                      <Field label="Profit split %"><input type="number" className={inputCls} placeholder="80" value={c.profitSplit} onChange={(e) => patchChallenge(c.id, { profitSplit: e.target.value === "" ? "" : Number(e.target.value) })} /></Field>
                      <Field label="Payout frequency"><input className={inputCls} placeholder="Bi-weekly" value={c.payoutFreq} onChange={(e) => patchChallenge(c.id, { payoutFreq: e.target.value })} /></Field>
                      <Field label="RR Points"><input type="number" className={inputCls} placeholder="200" value={c.rrPoints} onChange={(e) => patchChallenge(c.id, { rrPoints: e.target.value === "" ? "" : Number(e.target.value) })} /></Field>
                      <Field label="Original price ($)"><input type="number" className={inputCls} placeholder="539" value={c.originalPrice} onChange={(e) => patchChallenge(c.id, { originalPrice: e.target.value === "" ? "" : Number(e.target.value) })} /></Field>
                      <Field label="Sale price ($)"><input type="number" className={inputCls} placeholder="539" value={c.price} onChange={(e) => patchChallenge(c.id, { price: e.target.value === "" ? "" : Number(e.target.value) })} /></Field>
                      <Field label="Discount code"><input className={inputCls} value={c.discountCode ?? ""} onChange={(e) => patchChallenge(c.id, { discountCode: e.target.value })} /></Field>
                      <Field label="Badge">
                        <select className={selectCls} value={c.badge ?? ""} onChange={(e) => patchChallenge(c.id, { badge: e.target.value as ChallengeRow["badge"] })}>
                          <option value="">None</option><option>Top</option><option>New</option><option>Best Value</option>
                        </select>
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addChallenge} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:border-fuchsia-400/30 hover:text-white">
                <Plus className="h-3.5 w-3.5" /> Add another challenge / account
              </button>
              <SectionActions />
            </Panel>
          )}

          {section === "assets" && (
            <Panel title="Brand assets">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Logo (SVG / PNG)" span={2}>
                  <label className="block">
                    <input
                      type="file" accept="image/*" className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          setLogo(await uploadSingleAsset(f, "logo", "brands/logos"));
                          toast.success("Logo uploaded");
                        } catch (ex) {
                          toast.error(ex instanceof Error ? ex.message : "Unable to upload logo");
                        }
                      }}
                    />
                    <div className="relative flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-white/10 bg-white/5 text-xs text-muted-foreground hover:border-fuchsia-400/30">
                      {logo ? <img src={logo} alt="Logo" className="h-full w-full object-contain" /> : <span className="flex items-center"><Upload className="mr-2 h-4 w-4" /> {assetUploading === "logo" ? "Uploading logo..." : "Upload logo"}</span>}
                    </div>
                  </label>
                  {logo && <button onClick={() => setLogo("")} className="mt-2 text-[10px] text-rose-300 hover:underline">Remove logo</button>}
                </Field>

                <Field label="Cover image" span={2}>
                  <label className="block">
                    <input
                      type="file" accept="image/*" className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          setCover(await uploadSingleAsset(f, "cover", "brands/covers"));
                          toast.success("Cover uploaded");
                        } catch (ex) {
                          toast.error(ex instanceof Error ? ex.message : "Unable to upload cover");
                        }
                      }}
                    />
                    <div className="relative flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-white/10 bg-white/5 text-xs text-muted-foreground hover:border-fuchsia-400/30">
                      {cover ? <img src={cover} alt="Cover" className="h-full w-full object-cover" /> : <span className="flex items-center"><Upload className="mr-2 h-4 w-4" /> {assetUploading === "cover" ? "Uploading cover..." : "Upload cover"}</span>}
                    </div>
                  </label>
                  {cover && <button onClick={() => setCover("")} className="mt-2 text-[10px] text-rose-300 hover:underline">Remove cover</button>}
                </Field>

                <Field label="Screenshots / gallery" span={2}>
                  <label className="block">
                    <input
                      type="file" accept="image/*" multiple className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (!files.length) return;
                        try {
                          const urls = await uploadScreenshotAssets(files);
                          setScreenshots((current) => [...current, ...urls]);
                          toast.success(`${urls.length} screenshot${urls.length === 1 ? "" : "s"} uploaded`);
                        } catch (ex) {
                          toast.error(ex instanceof Error ? ex.message : "Unable to upload screenshots");
                        }
                      }}
                    />
                    <div className="flex h-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/5 text-xs text-muted-foreground hover:border-fuchsia-400/30">
                      <Upload className="mr-2 h-4 w-4" /> {assetUploading === "screenshots" ? "Uploading screenshots..." : "Add screenshots"}
                    </div>
                  </label>
                  {screenshots.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {screenshots.map((s, i) => (
                        <div key={i} className="relative h-20 overflow-hidden rounded-lg ring-1 ring-white/10">
                          <img src={s} alt="" className="h-full w-full object-cover" />
                          <button onClick={() => setScreenshots(screenshots.filter((_, j) => j !== i))} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </Field>

                <Field label="Primary color">
                  <div className="flex items-center gap-2">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg bg-transparent ring-1 ring-white/10" />
                    <input className={inputCls} value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                  </div>
                </Field>
              </div>
              <SectionActions />
            </Panel>
          )}

          {section === "trust" && (
            <Panel title="Trust & TBI">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Initial TBI score (0–100)">
                  <input type="number" min={0} max={100} className={inputCls} value={tbi} onChange={(e) => setTbi(Number(e.target.value))} />
                </Field>
                {!isBroker && category !== "Trading Software" && category !== "Education Provider" && <Field label="License #"><input className={inputCls} placeholder="DFSA / ASIC / —" value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} /></Field>}
                <Field label="KYB / license document" span={2}>
                  <label className="block">
                    <input
                      type="file" accept="image/*,.pdf" className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          setKybDoc(await uploadSingleAsset(f, "kyb", "brands/kyb"));
                          toast.success("KYB document uploaded");
                        } catch (ex) {
                          toast.error(ex instanceof Error ? ex.message : "Unable to upload KYB document");
                        }
                      }}
                    />
                    <div className="flex h-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-white/10 bg-white/5 text-xs text-muted-foreground hover:border-fuchsia-400/30">
                      {kybDoc ? <span className="text-emerald-300">✓ Document attached — click to replace</span> : <><Upload className="mr-2 h-4 w-4" /> Upload KYB / licenses</>}
                    </div>
                  </label>
                </Field>
              </div>
              <SectionActions />
            </Panel>
          )}

          {section === "seo" && (
            <Panel title="SEO">
              <div className="grid gap-3">
                <Field label="Meta title"><input className={inputCls} placeholder="Brand Review — RebateBoard" value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} /></Field>
                <Field label="Meta description"><textarea rows={3} className={inputCls} placeholder="160 chars…" value={seo.description} onChange={(e) => setSeo({ ...seo, description: e.target.value })} /></Field>
              </div>
              <SectionActions />
            </Panel>
          )}

          {section === "visibility" && (
            <Panel title="Visibility & status">
              <div className="space-y-3 text-sm text-white">
                <Field label="Status">
                  <select className={selectCls} value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="hidden">Hidden</option>
                    <option value="archived">Archived</option>
                  </select>
                </Field>
                <label className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
                  <span className="text-xs">Show in TBI rankings</span>
                  <input type="checkbox" checked={flags.inTbi} onChange={(e) => setFlags({ ...flags, inTbi: e.target.checked })} />
                </label>
                <label className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
                  <span className="text-xs">Eligible for cashback</span>
                  <input type="checkbox" checked={flags.cashbackEligible} onChange={(e) => setFlags({ ...flags, cashbackEligible: e.target.checked })} />
                </label>
                <label className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
                  <span className="text-xs">Featured brand</span>
                  <input type="checkbox" checked={flags.featured} onChange={(e) => setFlags({ ...flags, featured: e.target.checked })} />
                </label>
                <div className="pt-2">
                  <button
                    onClick={() => void persistBrand("published")}
                    disabled={saving}
                    className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {saving ? "Publishing..." : "Publish brand"}
                  </button>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
 * Reusable: labeled toggle field
 * ===================================================================== */
function ToggleField({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-white">{label}</div>
          {hint && <div className="mt-0.5 text-[10px] text-muted-foreground">{hint}</div>}
        </div>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? "bg-gradient-to-r from-fuchsia-500 to-violet-600" : "bg-white/10"}`}
        >
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${checked ? "left-[18px]" : "left-0.5"}`} />
        </button>
      </label>
    </div>
  );
}

/* =====================================================================
 * Reusable: step list panel (Link existing / Create new)
 * ===================================================================== */
function StepListPanel({
  title, hint, ctl,
}: {
  title: string;
  hint: string;
  ctl: {
    list: AccountStep[];
    add: () => void;
    remove: (id: string) => void;
    patch: (id: string, p: Partial<AccountStep>) => void;
    move: (id: string, dir: -1 | 1) => void;
  };
}) {
  return (
    <Panel
      title={`${title} (${ctl.list.length})`}
      action={
        <button onClick={ctl.add} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-[11px] font-bold text-white">
          <Plus className="h-3 w-3" /> Add step
        </button>
      }
    >
      <p className="mb-3 text-[11px] text-muted-foreground">{hint}</p>
      {ctl.list.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/5 p-6 text-center text-xs text-muted-foreground">
          No steps yet. Click <span className="font-bold text-white">+ Add step</span> to start.
        </div>
      )}
      <div className="space-y-2">
        {ctl.list.map((s, i) => (
          <div key={s.id} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-[10px] font-bold text-white">{i + 1}</span>
              <input
                className={inputCls}
                placeholder={`Step ${i + 1} title — e.g. "Log in to your broker portal"`}
                value={s.title}
                onChange={(e) => ctl.patch(s.id, { title: e.target.value })}
              />
              <div className="flex items-center gap-1">
                <button onClick={() => ctl.move(s.id, -1)} disabled={i === 0} className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white disabled:opacity-30">↑</button>
                <button onClick={() => ctl.move(s.id, 1)} disabled={i === ctl.list.length - 1} className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white disabled:opacity-30">↓</button>
                <button onClick={() => ctl.remove(s.id)} className="grid h-7 w-7 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
            <textarea
              rows={2}
              className={inputCls}
              placeholder="Detailed instructions for this step…"
              value={s.body}
              onChange={(e) => ctl.patch(s.id, { body: e.target.value })}
            />
          </div>
        ))}
      </div>
    </Panel>
  );
}
