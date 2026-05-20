import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatusPill, Toolbar } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, ThumbnailUploader, toast } from "@/components/superadmin/AdminActions";
import {
  deleteAdminBrand,
  fetchAdminBrands,
  updateAdminBrand,
  type AdminBrandRecord as AdminBrand,
} from "@/lib/admin-brands-api";
import { uploadMediaFile, uploadMediaFiles } from "@/lib/media-api";
import { Plus, Search, Edit3, Trash2, ExternalLink, ArrowUp, ArrowDown, RefreshCw, Copy } from "lucide-react";

export const Route = createFileRoute("/superadmin/brands")({
  component: BrandsPage,
});

const TABS = [
  { id: "all", label: "All" },
  { id: "Prop Firm", label: "Prop Firms" },
  { id: "Futures Prop Firm", label: "Futures Prop" },
  { id: "Crypto Prop Firm", label: "Crypto Prop" },
  { id: "Stock Prop Firm", label: "Stock Prop" },
  { id: "DEX Prop Firm", label: "DEX Prop" },
  { id: "Forex Broker", label: "Brokers" },
  { id: "Crypto Exchange", label: "Crypto Exchanges" },
  { id: "Trading Software", label: "Software" },
  { id: "Trading Tool", label: "Tools" },
  { id: "Education Provider", label: "Education" },
] as const;

const BROKER_FIELD_LABELS: Record<string, string> = {
  regulations: "Regulations",
  minDeposit: "Minimum deposit",
  maxLeverage: "Maximum leverage",
  platforms: "Platforms",
  assets: "Assets",
  spreads: "Spreads",
  commission: "Commission",
  accountTypes: "Account types",
  deposits: "Deposits",
  withdrawals: "Withdrawals",
  withdrawalSpeed: "Withdrawal speed",
  execution: "Execution",
  scalping: "Scalping",
  hedging: "Hedging",
  copyTrading: "Copy trading",
  islamic: "Islamic accounts",
  restrictedCountries: "Restricted countries",
};

const PROP_FIELD_LABELS: Record<string, string> = {
  evalType: "Evaluation type",
  sizes: "Account sizes",
  pricing: "Pricing",
  discountCode: "Discount code",
  profitSplit: "Profit split",
  profitTarget: "Profit target",
  dailyDD: "Daily drawdown",
  maxDD: "Max drawdown",
  minDays: "Minimum days",
  payoutSchedule: "Payout schedule",
  payoutMethods: "Payout methods",
  scaling: "Scaling",
  maxAlloc: "Maximum allocation",
  platform: "Platform",
  instruments: "Allowed instruments",
  news: "News trading",
  weekend: "Weekend holding",
  ea: "EA trading",
  copyTrading: "Copy trading",
  consistency: "Consistency rule",
  prohibited: "Prohibited strategies",
};

const EXCHANGE_FIELD_LABELS: Record<string, string> = {
  supportedAssets: "Supported assets",
  fees: "Fees",
  spot: "Spot",
  futures: "Futures",
  copyTrading: "Copy trading",
  kyc: "KYC",
  deposits: "Deposits",
  withdrawals: "Withdrawals",
  security: "Security features",
  licenses: "Licenses",
  referral: "Referral terms",
};

const TOOL_FIELD_LABELS: Record<string, string> = {
  type: "Tool type",
  pricing: "Pricing",
  trial: "Trial",
  platforms: "Platforms",
  integrations: "Integrations",
  discountCode: "Discount code",
  features: "Features",
  bestFor: "Best for",
};

const EDITORIAL_FIELD_LABELS: Record<string, string> = {
  keyFeatures: "Key features",
  tradingConditions: "Trading conditions",
  pros: "Pros",
  cons: "Cons",
  bestFor: "Best for",
  verdict: "Final verdict",
};

const PROFILE_FIELD_LABELS: Record<string, string> = {
  leverageOverall: "Overall leverage",
  leverageByAsset: "Leverage by asset",
  timeLimit: "Time limit",
  overnightHolding: "Overnight holding",
  community: "Community",
  supportChannels: "Support channels",
  supportResponse: "Support response",
  supportCommunity: "Support community",
  restrictedCountries: "Restricted countries",
  legalEntity: "Legal entity",
  transparencyNote: "Transparency note",
  publicFeedback: "Public feedback",
};

const selectCls = `${fieldCls} bg-slate-950 text-white [color-scheme:dark] [&>option]:bg-slate-950 [&>option]:text-white`;
const toolbarSelectCls = "rounded-full bg-slate-950 px-3 py-1.5 text-xs text-white ring-1 ring-white/10 [color-scheme:dark] [&>option]:bg-slate-950 [&>option]:text-white";

type ChallengeRow = {
  id: string;
  program: "1-Step" | "2-Step" | "Instant";
  size: "5K" | "10K" | "25K" | "50K" | "100K" | "200K" | "300K";
  asset: "FX" | "Futures" | "Crypto";
  profitTarget: string;
  dailyLoss: string;
  maxLoss: string;
  ptdd: string;
  profitSplit: number;
  payoutFreq: string;
  rrPoints: number;
  price: number;
  originalPrice: number;
  badge?: "" | "Top" | "New" | "Best Value";
  discountCode?: string;
  active: boolean;
};

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultChallenge(): ChallengeRow {
  return {
    id: makeId("ch"),
    program: "2-Step",
    size: "100K",
    asset: "FX",
    profitTarget: "8% / 5%",
    dailyLoss: "5%",
    maxLoss: "10%",
    ptdd: "1:0.77",
    profitSplit: 80,
    payoutFreq: "Bi-Weekly",
    rrPoints: 200,
    price: 539,
    originalPrice: 539,
    badge: "",
    discountCode: "",
    active: true,
  };
}

function normalizeChallenge(value: unknown): ChallengeRow {
  const row = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  const base = defaultChallenge();
  return {
    ...base,
    ...row,
    id: typeof row.id === "string" && row.id ? row.id : base.id,
    program: row.program === "1-Step" || row.program === "2-Step" || row.program === "Instant" ? row.program : base.program,
    size: row.size === "5K" || row.size === "10K" || row.size === "25K" || row.size === "50K" || row.size === "100K" || row.size === "200K" || row.size === "300K" ? row.size : base.size,
    asset: row.asset === "FX" || row.asset === "Futures" || row.asset === "Crypto" ? row.asset : base.asset,
    profitTarget: typeof row.profitTarget === "string" ? row.profitTarget : base.profitTarget,
    dailyLoss: typeof row.dailyLoss === "string" ? row.dailyLoss : base.dailyLoss,
    maxLoss: typeof row.maxLoss === "string" ? row.maxLoss : base.maxLoss,
    ptdd: typeof row.ptdd === "string" ? row.ptdd : base.ptdd,
    profitSplit: typeof row.profitSplit === "number" ? row.profitSplit : Number(row.profitSplit ?? base.profitSplit),
    payoutFreq: typeof row.payoutFreq === "string" ? row.payoutFreq : base.payoutFreq,
    rrPoints: typeof row.rrPoints === "number" ? row.rrPoints : Number(row.rrPoints ?? base.rrPoints),
    price: typeof row.price === "number" ? row.price : Number(row.price ?? base.price),
    originalPrice: typeof row.originalPrice === "number" ? row.originalPrice : Number(row.originalPrice ?? base.originalPrice),
    badge: row.badge === "Top" || row.badge === "New" || row.badge === "Best Value" || row.badge === "" ? row.badge : base.badge,
    discountCode: typeof row.discountCode === "string" ? row.discountCode : base.discountCode,
    active: typeof row.active === "boolean" ? row.active : base.active,
  };
}

function normalizeBrandForEdit(brand: AdminBrand): AdminBrand {
  const cashback = (brand.cashback ?? {}) as Record<string, unknown>;
  const {
    partnerCode: _partnerCode,
    partnerEmail: _partnerEmail,
    affiliateLink: _affiliateLink,
    emailSubjectTpl: _emailSubjectTpl,
    emailBodyTpl: _emailBodyTpl,
    proofRequired: _proofRequired,
    linkSteps: _linkSteps,
    createSteps: _createSteps,
    ...cleanCashback
  } = cashback;
  return {
    ...brand,
    cashback: cleanCashback,
    challenges: Array.isArray(brand.challenges) ? brand.challenges.map(normalizeChallenge) : [],
  };
}

function BrandsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("all");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [deleting, setDeleting] = useState<AdminBrand | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const brands = await fetchAdminBrands();
        if (!cancelled) setItems(brands);
      } catch (ex) {
        if (!cancelled) {
          toast.error(ex instanceof Error ? ex.message : "Unable to load brands");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const ranked = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.tbi - a.tbi);
    const categoryRanks = new Map<string, number>();
    return sorted.map((b) => {
      const nextRank = (categoryRanks.get(b.category) ?? 0) + 1;
      categoryRanks.set(b.category, nextRank);
      return { ...b, autoRank: nextRank };
    });
  }, [items]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    items.forEach((b) => {
      c[b.category] = (c[b.category] ?? 0) + 1;
    });
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    return ranked
      .filter((b) => tab === "all" || b.category === tab)
      .filter((b) => status === "all" || b.status === status)
      .filter((b) => !q.trim() || b.name.toLowerCase().includes(q.trim().toLowerCase()));
  }, [ranked, tab, status, q]);

  async function patchBrand(id: string, patch: Partial<AdminBrand>) {
    const next = await updateAdminBrand(id, patch);
    setItems((current) => current.map((row) => (row.id === id ? next : row)));
    return next;
  }

  async function handleResync() {
    try {
      const next = await Promise.all(items.map((b) => updateAdminBrand(b.id, { rankOverride: null })));
      setItems(next);
      toast.success("Ranks re-synced from TBI scores");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Unable to re-sync ranks");
    }
  }

  return (
    <div>
      <PageHeader
        title="Brands & Firms"
        subtitle={`${items.length} brands · auto-ranked by TBI · admin can override per row`}
        actions={
          <>
            <button onClick={handleResync} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <RefreshCw className="h-3.5 w-3.5" /> Re-sync rank from TBI
            </button>
            <Link to="/superadmin/brands/new" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
              <Plus className="h-3.5 w-3.5" /> Add brand
            </Link>
          </>
        }
      />

      <div className="mb-4 -mx-1 flex flex-wrap gap-2 overflow-x-auto px-1">
        {TABS.map((t) => {
          const active = tab === t.id;
          const count = counts[t.id] ?? 0;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                active
                  ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white ring-transparent"
                  : "bg-white/5 text-muted-foreground ring-white/10 hover:text-white"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${active ? "bg-white/20" : "bg-white/10"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <Panel title={`${tab === "all" ? "All brands" : TABS.find((t) => t.id === tab)?.label} - ${filtered.length} result${filtered.length === 1 ? "" : "s"}`}>
        <Toolbar>
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search brand by name..."
              className="w-full bg-transparent text-white outline-none placeholder:text-muted-foreground"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={toolbarSelectCls}
          >
            <option value="all">All statuses</option>
            <option value="verified">Verified</option>
            <option value="review">Under review</option>
            <option value="flagged">Flagged</option>
            <option value="draft">Draft</option>
          </select>
        </Toolbar>

        <DataTable head={<><th>Rank</th><th>Brand</th><th>Category</th><th>TBI</th><th>Status</th><th>30d Payouts</th><th>Complaints</th><th></th></>}>
          {filtered.map((b) => {
            const effectiveRank = b.rankOverride ?? b.autoRank;
            const isOverridden = b.rankOverride != null && b.rankOverride !== b.autoRank;
            const categoryCount = counts[b.category] ?? items.length;
            return (
              <tr key={b.id}>
                <td>
                  <div className="flex items-center gap-1">
                    <span className={`font-mono text-sm font-bold ${isOverridden ? "text-amber-300" : "text-white"}`}>
                      #{effectiveRank}
                    </span>
                    <div className="flex flex-col">
                      <button
                        onClick={async () => {
                          try {
                            await patchBrand(b.id, { rankOverride: Math.max(1, effectiveRank - 1) });
                          } catch (ex) {
                            toast.error(ex instanceof Error ? ex.message : "Unable to update rank");
                          }
                        }}
                        className="text-muted-foreground hover:text-emerald-300"
                        title="Move up"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await patchBrand(b.id, { rankOverride: Math.min(categoryCount, effectiveRank + 1) });
                          } catch (ex) {
                            toast.error(ex instanceof Error ? ex.message : "Unable to update rank");
                          }
                        }}
                        className="text-muted-foreground hover:text-rose-300"
                        title="Move down"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                    {isOverridden && (
                      <span className="ml-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[8px] font-bold text-amber-300 ring-1 ring-amber-400/30" title={`Auto rank was #${b.autoRank}`}>
                        OVR
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    {b.thumbnail ? (
                      <img src={b.thumbnail} className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/10" alt="" />
                    ) : (
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500/30 to-violet-600/30 text-[10px] font-bold text-white ring-1 ring-white/10">
                        {b.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{b.name}</div>
                      {b.website && (
                        <a href={b.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-fuchsia-300">
                          {b.website.replace(/^https?:\/\//, "")} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="text-muted-foreground">{b.category}</td>
                <td>
                  <span className={`font-mono font-bold ${b.tbi >= 90 ? "text-emerald-300" : b.tbi >= 80 ? "text-amber-300" : "text-rose-300"}`}>
                    {b.tbi}
                  </span>
                </td>
                <td><StatusPill status={b.status} /></td>
                <td className="font-mono">{b.payouts}</td>
                <td className={b.complaints > 15 ? "font-bold text-rose-300" : ""}>{b.complaints}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => {
                        navigate({
                          to: "/superadmin/brands/new",
                          search: { brandId: b.id } as never,
                        });
                      }}
                      className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white hover:bg-white/15"
                      title={b.visibility === "draft" || b.status === "draft" ? "Continue draft" : "Edit in steps"}
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button onClick={() => setDeleting(b)} className="grid h-7 w-7 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30" title="Delete">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {loading && (
            <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Loading brands...</td></tr>
          )}
          {!loading && filtered.length === 0 && (
            <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No brands match your filters.</td></tr>
          )}
        </DataTable>
      </Panel>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) {
            try {
              await deleteAdminBrand(deleting.id);
              setItems((current) => current.filter((row) => row.id !== deleting.id));
              toast.success(`Deleted "${deleting.name}"`);
            } catch (ex) {
              toast.error(ex instanceof Error ? ex.message : "Unable to delete brand");
            }
          }
        }}
        title={`Delete ${deleting?.name}?`}
        message="This will remove the brand from listings, TBI rankings and search. This cannot be undone."
        confirmText="Delete brand"
      />
    </div>
  );
}

function BrandEditModal({ brand, onClose, onSave }: { brand: AdminBrand; onClose: () => void; onSave: (patch: Partial<AdminBrand>) => void }) {
  const [form, setForm] = useState<AdminBrand>(() => normalizeBrandForEdit(brand));
  const [saving, setSaving] = useState(false);
  const [assetUploading, setAssetUploading] = useState<null | "thumbnail" | "cover" | "screenshots" | "kyb">(null);

  const identity = (form.identity ?? {}) as Record<string, string>;
  const founder = (form.founder ?? {}) as Record<string, string>;
  const broker = (form.broker ?? {}) as Record<string, string>;
  const prop = (form.prop ?? {}) as Record<string, string>;
  const exchange = (form.exchange ?? {}) as Record<string, string>;
  const tool = (form.tool ?? {}) as Record<string, string>;
  const editorial = (form.editorial ?? {}) as Record<string, string>;
  const profile = (form.profile ?? {}) as Record<string, string>;
  const cashback = (form.cashback ?? {}) as Record<string, unknown>;
  const challenges = Array.isArray(form.challenges) ? (form.challenges as ChallengeRow[]) : [];
  const trust = (form.trust ?? {}) as Record<string, string | number>;
  const seo = (form.seo ?? {}) as Record<string, string>;
  const flags = (form.flags ?? {}) as Record<string, boolean>;

  function patchObject<K extends keyof AdminBrand>(key: K, field: string, value: unknown) {
    setForm((current) => ({
      ...current,
      [key]: {
        ...((current[key] as Record<string, unknown> | undefined) ?? {}),
        [field]: value,
      },
    }));
  }

  function patchCashback(field: string, value: unknown) {
    patchObject("cashback", field, value);
  }

  async function uploadSingleAsset(file: File, kind: "thumbnail" | "cover" | "kyb", folder: string) {
    setAssetUploading(kind);
    try {
      const uploaded = await uploadMediaFile(file, {
        folder,
        prefix: form.slug || form.name || "brand",
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
        prefix: form.slug || form.name || "brand",
      });
      return uploaded.map((item) => item.url);
    } finally {
      setAssetUploading(null);
    }
  }

  function addChallenge() {
    setForm((current) => ({ ...current, challenges: [...(Array.isArray(current.challenges) ? current.challenges : []), defaultChallenge()] }));
  }

  function duplicateChallenge(id: string) {
    setForm((current) => {
      const rows = Array.isArray(current.challenges) ? (current.challenges as ChallengeRow[]) : [];
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) return current;
      const clone = { ...rows[index], id: makeId("ch") };
      return { ...current, challenges: [...rows.slice(0, index + 1), clone, ...rows.slice(index + 1)] };
    });
  }

  function patchChallenge(id: string, patch: Partial<ChallengeRow>) {
    setForm((current) => ({
      ...current,
      challenges: (Array.isArray(current.challenges) ? current.challenges : []).map((row) =>
        (row as ChallengeRow).id === id ? { ...(row as ChallengeRow), ...patch } : row,
      ),
    }));
  }

  function removeChallenge(id: string) {
    setForm((current) => ({
      ...current,
      challenges: (Array.isArray(current.challenges) ? current.challenges : []).filter((row) => (row as ChallengeRow).id !== id),
    }));
  }

  async function submit() {
    setSaving(true);
    try {
      const cleanCashback = { ...(form.cashback ?? {}) } as Record<string, unknown>;
      delete cleanCashback.partnerCode;
      delete cleanCashback.partnerEmail;
      delete cleanCashback.affiliateLink;
      delete cleanCashback.emailSubjectTpl;
      delete cleanCashback.emailBodyTpl;
      delete cleanCashback.proofRequired;
      delete cleanCashback.linkSteps;
      delete cleanCashback.createSteps;
      await onSave({ ...form, cashback: cleanCashback });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${brand.name}`}
      subtitle="Update the full brand profile, operations config, trust data, and public content."
      size="xl"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
          <button onClick={() => void submit()} disabled={saving} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-sm font-semibold text-white">Core</div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Name"><input className={fieldCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Slug"><input className={fieldCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
            <Field label="Category">
              <select className={selectCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as AdminBrand["category"] })}>
                {TABS.filter((t) => t.id !== "all").map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
              </select>
            </Field>
            <Field label="Visibility">
              <select className={selectCls} value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as AdminBrand["visibility"] })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="Status">
              <select className={selectCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AdminBrand["status"] })}>
                <option value="verified">Verified</option>
                <option value="review">Under review</option>
                <option value="flagged">Flagged</option>
                <option value="draft">Draft</option>
              </select>
            </Field>
            <Field label="Website"><input className={fieldCls} value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." /></Field>
            <Field label="Support email"><input className={fieldCls} value={form.supportEmail ?? ""} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} placeholder="support@brand.com" /></Field>
            <Field label="Primary color"><input className={fieldCls} value={form.primaryColor ?? ""} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} /></Field>
            <Field label="TBI score (0-100)" hint="Drives auto-rank. Use the TBI engine for full recalculation.">
              <input type="number" min={0} max={100} className={fieldCls} value={form.tbi} onChange={(e) => setForm({ ...form, tbi: Number(e.target.value) })} />
            </Field>
            <Field label="Rank override" hint="Leave empty to follow auto-rank from TBI.">
              <input type="number" min={1} className={fieldCls} value={form.rankOverride ?? ""} onChange={(e) => setForm({ ...form, rankOverride: e.target.value === "" ? null : Number(e.target.value) })} />
            </Field>
            <Field label="Payouts (display)"><input className={fieldCls} value={form.payouts} onChange={(e) => setForm({ ...form, payouts: e.target.value })} /></Field>
            <Field label="Complaints count"><input type="number" className={fieldCls} value={form.complaints} onChange={(e) => setForm({ ...form, complaints: Number(e.target.value) })} /></Field>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-sm font-semibold text-white">Assets</div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <ThumbnailUploader
                label="Logo / thumbnail"
                value={form.thumbnail}
                onChange={(url) => setForm({ ...form, thumbnail: url })}
                onSelectFile={(file) => uploadSingleAsset(file, "thumbnail", "brands/logos")}
              />
              {assetUploading === "thumbnail" && <p className="mt-1 text-[10px] text-muted-foreground">Uploading logo...</p>}
            </div>
            <div className="md:col-span-2">
              <ThumbnailUploader
                label="Cover image"
                value={form.cover}
                onChange={(url) => setForm({ ...form, cover: url })}
                onSelectFile={(file) => uploadSingleAsset(file, "cover", "brands/covers")}
              />
              {assetUploading === "cover" && <p className="mt-1 text-[10px] text-muted-foreground">Uploading cover...</p>}
            </div>
            <Field label="Screenshots / gallery" span={2}>
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (!files.length) return;
                    try {
                      const urls = await uploadScreenshotAssets(files);
                      setForm((current) => ({ ...current, screenshots: [...(current.screenshots ?? []), ...urls] }));
                      toast.success(`${urls.length} screenshot${urls.length === 1 ? "" : "s"} uploaded`);
                    } catch (ex) {
                      toast.error(ex instanceof Error ? ex.message : "Unable to upload screenshots");
                    }
                  }}
                />
                <div className="flex h-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/5 text-xs text-muted-foreground hover:border-fuchsia-400/30">
                  <Plus className="mr-2 h-4 w-4" /> {assetUploading === "screenshots" ? "Uploading screenshots..." : "Add screenshots"}
                </div>
              </label>
              {(form.screenshots ?? []).length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(form.screenshots ?? []).map((url, index) => (
                    <div key={`${url}-${index}`} className="relative h-24 overflow-hidden rounded-lg ring-1 ring-white/10">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, screenshots: (current.screenshots ?? []).filter((_, itemIndex) => itemIndex !== index) }))}
                        className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-sm font-semibold text-white">Identity</div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Founded year"><input className={fieldCls} value={String(identity.founded ?? "")} onChange={(e) => patchObject("identity", "founded", e.target.value)} /></Field>
            <Field label="Headquarters"><input className={fieldCls} value={String(identity.hq ?? "")} onChange={(e) => patchObject("identity", "hq", e.target.value)} /></Field>
            <Field label="Tagline" span={2}><input className={fieldCls} value={String(identity.tagline ?? "")} onChange={(e) => patchObject("identity", "tagline", e.target.value)} /></Field>
            <Field label="Description" span={2}><textarea rows={3} className={fieldCls} value={String(identity.description ?? "")} onChange={(e) => patchObject("identity", "description", e.target.value)} /></Field>
            <Field label="Full editorial review" span={2}><textarea rows={5} className={fieldCls} value={String(identity.editorial ?? "")} onChange={(e) => patchObject("identity", "editorial", e.target.value)} /></Field>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-sm font-semibold text-white">Founder & Social</div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="CEO / founder"><input className={fieldCls} value={String(founder.ceo ?? "")} onChange={(e) => patchObject("founder", "ceo", e.target.value)} /></Field>
            <Field label="LinkedIn"><input className={fieldCls} value={String(founder.founderLi ?? "")} onChange={(e) => patchObject("founder", "founderLi", e.target.value)} /></Field>
            <Field label="X / Twitter"><input className={fieldCls} value={String(founder.founderX ?? "")} onChange={(e) => patchObject("founder", "founderX", e.target.value)} /></Field>
            <Field label="YouTube review"><input className={fieldCls} value={String(founder.yt ?? "")} onChange={(e) => patchObject("founder", "yt", e.target.value)} /></Field>
            <Field label="Tags" span={2}><input className={fieldCls} value={String(founder.tags ?? "")} onChange={(e) => patchObject("founder", "tags", e.target.value)} /></Field>
          </div>
        </div>

        {!!form.broker && (
          <SectionObjectEditor title="Broker specifics" values={broker} labels={BROKER_FIELD_LABELS} onChange={(field, value) => patchObject("broker", field, value)} />
        )}
        {!!form.prop && (
          <SectionObjectEditor title="Prop firm specifics" values={prop} labels={PROP_FIELD_LABELS} onChange={(field, value) => patchObject("prop", field, value)} />
        )}
        {!!form.exchange && (
          <SectionObjectEditor title="Exchange specifics" values={exchange} labels={EXCHANGE_FIELD_LABELS} onChange={(field, value) => patchObject("exchange", field, value)} />
        )}
        {!!form.tool && (
          <SectionObjectEditor title="Tool specifics" values={tool} labels={TOOL_FIELD_LABELS} onChange={(field, value) => patchObject("tool", field, value)} />
        )}

        <SectionObjectEditor title="Editorial review" values={editorial} labels={EDITORIAL_FIELD_LABELS} onChange={(field, value) => patchObject("editorial", field, value)} />
        <SectionObjectEditor title="Profile content" values={profile} labels={PROFILE_FIELD_LABELS} onChange={(field, value) => patchObject("profile", field, value)} />

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-sm font-semibold text-white">Cashback / Rebate</div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Eligible"><input className={fieldCls} value={String(cashback.eligible ?? "")} onChange={(e) => patchCashback("eligible", e.target.value)} /></Field>
            <Field label="Type"><input className={fieldCls} value={String(cashback.type ?? "")} onChange={(e) => patchCashback("type", e.target.value)} /></Field>
            <Field label="Default cashback %"><input type="number" className={fieldCls} value={Number(cashback.defaultPct ?? 0)} onChange={(e) => patchCashback("defaultPct", Number(e.target.value))} /></Field>
            <Field label="Maximum cashback %"><input type="number" className={fieldCls} value={Number(cashback.maxPct ?? 0)} onChange={(e) => patchCashback("maxPct", Number(e.target.value))} /></Field>
            <Field label="How RebateBoard earns" span={2}><input className={fieldCls} value={String(cashback.howRBEarns ?? "")} onChange={(e) => patchCashback("howRBEarns", e.target.value)} /></Field>
            <Field label="How trader earns" span={2}><input className={fieldCls} value={String(cashback.howTraderEarns ?? "")} onChange={(e) => patchCashback("howTraderEarns", e.target.value)} /></Field>
            <Field label="Terms" span={2}><textarea rows={3} className={fieldCls} value={String(cashback.terms ?? "")} onChange={(e) => patchCashback("terms", e.target.value)} /></Field>
            <Field label="Internal note" span={2}><textarea rows={2} className={fieldCls} value={String(cashback.note ?? "")} onChange={(e) => patchCashback("note", e.target.value)} /></Field>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Challenges</div>
              <div className="text-[11px] text-muted-foreground">Maintain the same challenge cards and payout economics used on the create flow.</div>
            </div>
            <button type="button" onClick={addChallenge} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-[11px] font-bold text-white">
              <Plus className="h-3 w-3" /> Add challenge
            </button>
          </div>
          <div className="space-y-3">
            {challenges.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/5 p-6 text-center text-xs text-muted-foreground">
                No challenges yet. Click <span className="font-bold text-white">Add challenge</span> to create the first one.
              </div>
            )}
            {challenges.map((challenge, index) => (
              <div key={challenge.id} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-bold text-fuchsia-300 ring-1 ring-fuchsia-400/30">#{index + 1}</span>
                    <span className="text-xs font-bold text-white">{challenge.program} · {challenge.size} · {challenge.asset}</span>
                    <label className="ml-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <input type="checkbox" checked={challenge.active} onChange={(e) => patchChallenge(challenge.id, { active: e.target.checked })} /> Active
                    </label>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => duplicateChallenge(challenge.id)} className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white hover:bg-white/15" title="Duplicate challenge">
                      <Copy className="h-3 w-3" />
                    </button>
                    <button type="button" onClick={() => removeChallenge(challenge.id)} className="grid h-7 w-7 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30 hover:bg-rose-500/25" title="Remove challenge">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <Field label="Program">
                    <select className={selectCls} value={challenge.program} onChange={(e) => patchChallenge(challenge.id, { program: e.target.value as ChallengeRow["program"] })}>
                      <option>1-Step</option>
                      <option>2-Step</option>
                      <option>Instant</option>
                    </select>
                  </Field>
                  <Field label="Account size">
                    <select className={selectCls} value={challenge.size} onChange={(e) => patchChallenge(challenge.id, { size: e.target.value as ChallengeRow["size"] })}>
                      <option>5K</option>
                      <option>10K</option>
                      <option>25K</option>
                      <option>50K</option>
                      <option>100K</option>
                      <option>200K</option>
                      <option>300K</option>
                    </select>
                  </Field>
                  <Field label="Asset class">
                    <select className={selectCls} value={challenge.asset} onChange={(e) => patchChallenge(challenge.id, { asset: e.target.value as ChallengeRow["asset"] })}>
                      <option>FX</option>
                      <option>Futures</option>
                      <option>Crypto</option>
                    </select>
                  </Field>
                  <Field label="Profit target"><input className={fieldCls} value={challenge.profitTarget} onChange={(e) => patchChallenge(challenge.id, { profitTarget: e.target.value })} /></Field>
                  <Field label="Daily loss"><input className={fieldCls} value={challenge.dailyLoss} onChange={(e) => patchChallenge(challenge.id, { dailyLoss: e.target.value })} /></Field>
                  <Field label="Max loss"><input className={fieldCls} value={challenge.maxLoss} onChange={(e) => patchChallenge(challenge.id, { maxLoss: e.target.value })} /></Field>
                  <Field label="PT : DD ratio"><input className={fieldCls} value={challenge.ptdd} onChange={(e) => patchChallenge(challenge.id, { ptdd: e.target.value })} /></Field>
                  <Field label="Profit split %"><input type="number" className={fieldCls} value={challenge.profitSplit} onChange={(e) => patchChallenge(challenge.id, { profitSplit: Number(e.target.value) })} /></Field>
                  <Field label="Payout frequency"><input className={fieldCls} value={challenge.payoutFreq} onChange={(e) => patchChallenge(challenge.id, { payoutFreq: e.target.value })} /></Field>
                  <Field label="RR Points"><input type="number" className={fieldCls} value={challenge.rrPoints} onChange={(e) => patchChallenge(challenge.id, { rrPoints: Number(e.target.value) })} /></Field>
                  <Field label="Original price ($)"><input type="number" className={fieldCls} value={challenge.originalPrice} onChange={(e) => patchChallenge(challenge.id, { originalPrice: Number(e.target.value) })} /></Field>
                  <Field label="Sale price ($)"><input type="number" className={fieldCls} value={challenge.price} onChange={(e) => patchChallenge(challenge.id, { price: Number(e.target.value) })} /></Field>
                  <Field label="Discount code"><input className={fieldCls} value={challenge.discountCode ?? ""} onChange={(e) => patchChallenge(challenge.id, { discountCode: e.target.value })} /></Field>
                  <Field label="Badge">
                    <select className={selectCls} value={challenge.badge ?? ""} onChange={(e) => patchChallenge(challenge.id, { badge: e.target.value as ChallengeRow["badge"] })}>
                      <option value="">None</option>
                      <option>Top</option>
                      <option>New</option>
                      <option>Best Value</option>
                    </select>
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-sm font-semibold text-white">Trust & SEO</div>
          <div className="grid gap-3 md:grid-cols-2">
            {form.category !== "Forex Broker" && (
              <Field label="Trust license #"><input className={fieldCls} value={String(trust.licenseNo ?? "")} onChange={(e) => patchObject("trust", "licenseNo", e.target.value)} /></Field>
            )}
            <Field label="KYB document">
              <label className="block">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadSingleAsset(file, "kyb", "brands/kyb");
                      patchObject("trust", "kybDoc", url);
                      toast.success("KYB document uploaded");
                    } catch (ex) {
                      toast.error(ex instanceof Error ? ex.message : "Unable to upload KYB document");
                    }
                  }}
                />
                <div className="flex h-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/5 text-xs text-muted-foreground hover:border-fuchsia-400/30">
                  {String(trust.kybDoc ?? "")
                    ? "Document attached - click to replace"
                    : assetUploading === "kyb"
                      ? "Uploading KYB document..."
                      : "Upload KYB / licenses"}
                </div>
              </label>
              {String(trust.kybDoc ?? "") && (
                <a href={String(trust.kybDoc)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[10px] text-fuchsia-300 hover:underline">
                  View current document
                </a>
              )}
            </Field>
            <Field label="Legal entity"><input className={fieldCls} value={String(trust.legalEntity ?? "")} onChange={(e) => patchObject("trust", "legalEntity", e.target.value)} /></Field>
            <Field label="Transparency note"><input className={fieldCls} value={String(trust.transparencyNote ?? "")} onChange={(e) => patchObject("trust", "transparencyNote", e.target.value)} /></Field>
            <Field label="Public feedback" span={2}><textarea rows={2} className={fieldCls} value={String(trust.publicFeedback ?? "")} onChange={(e) => patchObject("trust", "publicFeedback", e.target.value)} /></Field>
            <Field label="SEO title" span={2}><input className={fieldCls} value={String(seo.title ?? "")} onChange={(e) => patchObject("seo", "title", e.target.value)} /></Field>
            <Field label="SEO description" span={2}><textarea rows={3} className={fieldCls} value={String(seo.description ?? "")} onChange={(e) => patchObject("seo", "description", e.target.value)} /></Field>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-sm font-semibold text-white">Flags</div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
              <span className="text-xs text-white">Show in TBI</span>
              <input type="checkbox" checked={Boolean(flags.inTbi)} onChange={(e) => patchObject("flags", "inTbi", e.target.checked)} />
            </label>
            <label className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
              <span className="text-xs text-white">Cashback eligible</span>
              <input type="checkbox" checked={Boolean(flags.cashbackEligible)} onChange={(e) => patchObject("flags", "cashbackEligible", e.target.checked)} />
            </label>
            <label className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
              <span className="text-xs text-white">Featured brand</span>
              <input type="checkbox" checked={Boolean(flags.featured)} onChange={(e) => patchObject("flags", "featured", e.target.checked)} />
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function SectionObjectEditor({
  title,
  values,
  labels,
  onChange,
}: {
  title: string;
  values: Record<string, string>;
  labels: Record<string, string>;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 text-sm font-semibold text-white">{title}</div>
      <div className="grid gap-3 md:grid-cols-2">
        {Object.entries(labels).map(([field, label]) => {
          const value = String(values[field] ?? "");
          const isLong = value.length > 80 || field.toLowerCase().includes("description") || field.toLowerCase().includes("prohibited") || field.toLowerCase().includes("features") || field.toLowerCase().includes("community");
          return (
            <Field key={field} label={label} span={isLong ? 2 : 1}>
              {isLong ? (
                <textarea rows={3} className={fieldCls} value={value} onChange={(e) => onChange(field, e.target.value)} />
              ) : (
                <input className={fieldCls} value={value} onChange={(e) => onChange(field, e.target.value)} />
              )}
            </Field>
          );
        })}
      </div>
    </div>
  );
}
