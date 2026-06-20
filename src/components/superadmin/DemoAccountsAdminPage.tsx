import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Flame,
  Globe,
  KeyRound,
  Monitor,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import { fetchAdminBrands, type AdminBrandRecord } from "@/lib/admin-brands-api";
import {
  deleteDemoAccount,
  fetchAdminDemoAccountsBoard,
  rotateDemoAccount,
  saveDemoAccount,
  updateDemoAccount,
  type DemoAccountPlatform,
  type DemoAccountRecord,
  type DemoAccountStatus,
} from "@/lib/demo-accounts-api";
import { DataTable, PageHeader, Panel, Pill, StatCard } from "@/components/superadmin/AdminUI";
import { ConfirmDialog, Field, Modal, fieldCls, selectCls, toast } from "@/components/superadmin/AdminActions";

const PLATFORM_OPTIONS: Array<DemoAccountPlatform | "all"> = ["all", "MT4", "MT5", "cTrader", "DXtrade", "TradingView"];
const STATUS_OPTIONS: DemoAccountStatus[] = ["draft", "published", "archived"];

const platformPillClass: Record<DemoAccountPlatform, string> = {
  MT4: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  MT5: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/30",
  cTrader: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  DXtrade: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  TradingView: "bg-violet-500/15 text-violet-300 ring-violet-400/30",
};

type BrandOption = {
  id: string;
  name: string;
  slug: string;
  category: string;
  thumbnail?: string;
};

type DemoAccountFormState = {
  id?: string;
  brandId: string;
  brand: string;
  slug: string;
  category: string;
  plan: string;
  platform: DemoAccountPlatform;
  countries: string;
  accountId: string;
  password: string;
  investorPassword: string;
  server: string;
  terminalUrl: string;
  notes: string;
  status: DemoAccountStatus;
  verified: boolean;
  hot: boolean;
  enabled: boolean;
  displayOrder: string;
};

const EMPTY_FORM: DemoAccountFormState = {
  brandId: "",
  brand: "",
  slug: "",
  category: "Prop Firm",
  plan: "",
  platform: "MT5",
  countries: "Global",
  accountId: "",
  password: "",
  investorPassword: "",
  server: "",
  terminalUrl: "",
  notes: "",
  status: "draft",
  verified: false,
  hot: false,
  enabled: true,
  displayOrder: "0",
};

export function DemoAccountsAdminPage() {
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<DemoAccountPlatform | "all">("all");
  const [rows, setRows] = useState<DemoAccountRecord[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    verified: 0,
    platforms: 0,
    platformLabels: "",
    hot: 0,
    published: 0,
  });
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DemoAccountRecord | null>(null);
  const [form, setForm] = useState<DemoAccountFormState>(EMPTY_FORM);

  useEffect(() => {
    void loadPage();
  }, []);

  async function loadPage() {
    setLoading(true);
    try {
      const [board, brandRows] = await Promise.all([
        fetchAdminDemoAccountsBoard(),
        fetchAdminBrands(),
      ]);
      applyBoard(board);
      setBrands(
        brandRows.map((brand: AdminBrandRecord) => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          category: brand.category,
          thumbnail: brand.thumbnail,
        })),
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to load demo accounts");
    } finally {
      setLoading(false);
    }
  }

  function applyBoard(board: Awaited<ReturnType<typeof fetchAdminDemoAccountsBoard>>) {
    setRows(board.rows);
    setMetrics({
      total: board.stats.total,
      verified: board.stats.verified,
      platforms: board.stats.platforms,
      platformLabels: board.stats.platformLabels ?? "",
      hot: board.stats.hot,
      published: board.stats.published ?? board.rows.filter((row) => row.enabled && row.status === "published").length,
    });
  }

  function openCreateModal() {
    setForm({
      ...EMPTY_FORM,
      displayOrder: String(rows.length),
    });
    setEditorOpen(true);
  }

  function openEditModal(row: DemoAccountRecord) {
    setForm({
      id: row.id,
      brandId: row.brandId,
      brand: row.brand,
      slug: row.slug,
      category: row.category,
      plan: row.plan,
      platform: (PLATFORM_OPTIONS.includes(row.platform as DemoAccountPlatform) ? row.platform : "MT5") as DemoAccountPlatform,
      countries: row.countries,
      accountId: row.accountId,
      password: row.password,
      investorPassword: row.investorPassword,
      server: row.server,
      terminalUrl: row.terminalUrl,
      notes: row.notes,
      status: row.status,
      verified: row.verified,
      hot: row.hot,
      enabled: row.enabled,
      displayOrder: String(row.displayOrder),
    });
    setEditorOpen(true);
  }

  function onBrandChange(brandId: string) {
    const brand = brands.find((item) => item.id === brandId);
    setForm((current) => ({
      ...current,
      brandId,
      brand: brand?.name ?? current.brand,
      slug: brand?.slug ?? current.slug,
      category: brand?.category ?? current.category,
    }));
  }

  async function handleSubmit() {
    if (!form.plan.trim()) return toast.error("Plan is required");
    if (!form.accountId.trim()) return toast.error("Account ID is required");
    if (!form.brand.trim()) return toast.error("Brand name is required");

    setSaving(true);
    try {
      const payload = {
        brandId: form.brandId,
        brand: form.brand.trim(),
        slug: form.slug.trim(),
        category: form.category.trim(),
        plan: form.plan.trim(),
        platform: form.platform,
        countries: form.countries.trim(),
        accountId: form.accountId.trim(),
        password: form.password.trim(),
        investorPassword: form.investorPassword.trim(),
        server: form.server.trim(),
        terminalUrl: form.terminalUrl.trim(),
        notes: form.notes.trim(),
        status: form.status,
        verified: form.verified,
        hot: form.hot,
        enabled: form.enabled,
        displayOrder: Number(form.displayOrder || 0),
      };

      const board = form.id
        ? await updateDemoAccount(form.id, payload)
        : await saveDemoAccount(payload);
      applyBoard(board);
      setEditorOpen(false);
      toast.success(form.id ? "Demo account updated" : "Demo account created");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to save demo account");
    } finally {
      setSaving(false);
    }
  }

  async function handleRotate(row: DemoAccountRecord) {
    try {
      const board = await rotateDemoAccount(row.id, {
        note: `Rotation triggered from superadmin list for ${row.brand}`,
      });
      applyBoard(board);
      toast.success(`Credential rotation logged for ${row.brand}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to rotate credentials");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    try {
      const board = await deleteDemoAccount(deleteTarget.id);
      applyBoard(board);
      toast.success(`${deleteTarget.brand} removed from demo accounts`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to delete demo account");
    }
  }

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesTerm =
        !term ||
        row.brand.toLowerCase().includes(term) ||
        row.plan.toLowerCase().includes(term) ||
        row.server.toLowerCase().includes(term);

      const matchesPlatform = platformFilter === "all" || row.platform === platformFilter;
      return matchesTerm && matchesPlatform;
    });
  }, [platformFilter, query, rows]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prop Firm Demo Accounts"
        subtitle="Manage the public demo logins shown on /demo-accounts. Each row is published live."
        actions={
          <>
            <button
              type="button"
              onClick={() => window.open("/demo-accounts", "_blank", "noopener,noreferrer")}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Globe className="h-4 w-4" />
              View public page
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(192,132,252,0.28)]"
            >
              <Plus className="h-4 w-4" />
              New Demo Account
            </button>
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Demo Accounts" value={String(metrics.total)} delta={`${metrics.published} live`} tone="flat" />
        <StatCard label="Verified" value={String(metrics.verified)} delta="QA passed" tone="up" />
        <StatCard label="Platforms" value={String(metrics.platforms)} delta={metrics.platformLabels || "No platforms yet"} tone="flat" />
        <StatCard label="Hot Picks" value={String(metrics.hot)} delta="Promoted" tone="up" />
      </div>

      <Panel title={`Demo Accounts — ${filteredRows.length}`} action={<Pill tone="neutral">Published live</Pill>}>
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search brand or plan..."
              className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-muted-foreground focus:border-fuchsia-400/40 focus:bg-white/[0.07]"
            />
          </div>

          <select
            value={platformFilter}
            onChange={(event) => setPlatformFilter(event.target.value as DemoAccountPlatform | "all")}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition focus:border-fuchsia-400/40"
          >
            {PLATFORM_OPTIONS.map((platform) => (
              <option key={platform} value={platform} className="bg-[#150829] text-white">
                {platform === "all" ? "All platforms" : platform}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          head={
            <>
              <th>Brand</th>
              <th>Platform</th>
              <th>Plan</th>
              <th>Countries</th>
              <th>Account</th>
              <th>Server</th>
              <th>Flags</th>
              <th>Actions</th>
            </>
          }
        >
          {loading ? (
            <tr>
              <td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                Loading demo accounts...
              </td>
            </tr>
          ) : filteredRows.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                No demo accounts found yet.
              </td>
            </tr>
          ) : filteredRows.map((row) => (
            <tr key={row.id}>
              <td>
                <div className="flex items-center gap-3">
                  {row.logo ? (
                    <img src={row.logo} alt={row.brand} className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10" />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500/70 to-violet-600/70 text-xs font-bold text-white ring-1 ring-white/10">
                      {row.brand
                        .split(" ")
                        .slice(0, 2)
                        .map((word) => word[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-white">{row.brand}</div>
                    <div className="text-xs text-muted-foreground">{row.slug || row.category}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${platformPillClass[row.platform as DemoAccountPlatform] ?? "bg-white/10 text-white ring-white/10"}`}>
                  {row.platform}
                </span>
              </td>
              <td className="text-white/85">{row.plan}</td>
              <td className="text-xs text-muted-foreground">{row.countries}</td>
              <td className="font-mono text-sm font-semibold text-white">{row.accountId}</td>
              <td className="text-sm text-white/85">
                <div>{row.server || "-"}</div>
                <div className="text-[11px] text-muted-foreground">v{row.credentialVersion}</div>
              </td>
              <td>
                <div className="flex flex-wrap gap-1.5">
                  <Pill tone={row.status === "published" ? "good" : row.status === "archived" ? "bad" : "neutral"}>
                    {row.status}
                  </Pill>
                  {row.verified ? (
                    <Pill tone="good">
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </span>
                    </Pill>
                  ) : (
                    <Pill tone="warn">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Pending QA
                      </span>
                    </Pill>
                  )}
                  {row.hot ? (
                    <Pill tone="warn">
                      <span className="inline-flex items-center gap-1">
                        <Flame className="h-3 w-3" />
                        Hot
                      </span>
                    </Pill>
                  ) : null}
                </div>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <IconActionButton label={`Edit ${row.brand}`} icon={Pencil} onClick={() => openEditModal(row)} />
                  <IconActionButton label={`Rotate credentials for ${row.brand}`} icon={KeyRound} onClick={() => void handleRotate(row)} />
                  <IconActionButton label={`Delete ${row.brand}`} icon={Trash2} tone="danger" onClick={() => setDeleteTarget(row)} />
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Publishing notes" action={<Monitor className="h-3.5 w-3.5 text-fuchsia-300" />}>
          <div className="grid gap-3 md:grid-cols-3">
            <InfoCard
              title="Credential hygiene"
              text="Use login sets created only for demo exposure. Rotate passwords whenever a row is edited or unpublished."
            />
            <InfoCard
              title="Verification policy"
              text="Only QA-passed accounts should carry the verified flag. Pending rows can exist internally but should not be promoted."
            />
            <InfoCard
              title="Hot pick logic"
              text="Use the hot flag for the few accounts you want highlighted on the public experience without changing the full list."
            />
          </div>
        </Panel>

        <Panel title="Platform mix" action={<Pill tone="neutral">{metrics.platforms} live platforms</Pill>}>
          <div className="space-y-3">
            {PLATFORM_OPTIONS.filter((platform): platform is DemoAccountPlatform => platform !== "all").map((platform) => {
              const count = rows.filter((row) => row.platform === platform).length;
              const pct = rows.length > 0 ? Math.round((count / rows.length) * 100) : 0;

              return (
                <div key={platform}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{platform}</span>
                    <span className="text-muted-foreground">
                      {count} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Modal
        open={editorOpen}
        onClose={() => !saving && setEditorOpen(false)}
        title={form.id ? "Edit Demo Account" : "New Demo Account"}
        subtitle="Published rows become visible on the public /demo-accounts page."
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setEditorOpen(false)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : form.id ? "Save changes" : "Create demo account"}
            </button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Brand">
            <select value={form.brandId} onChange={(event) => onBrandChange(event.target.value)} className={selectCls}>
              <option value="">Custom / manual brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Brand Name">
            <input value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} className={fieldCls} placeholder="FTMO Pro" />
          </Field>
          <Field label="Category">
            <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className={fieldCls} placeholder="Prop Firm" />
          </Field>
          <Field label="Platform">
            <select value={form.platform} onChange={(event) => setForm((current) => ({ ...current, platform: event.target.value as DemoAccountPlatform }))} className={selectCls}>
              {PLATFORM_OPTIONS.filter((platform): platform is DemoAccountPlatform => platform !== "all").map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Plan">
            <input value={form.plan} onChange={(event) => setForm((current) => ({ ...current, plan: event.target.value }))} className={fieldCls} placeholder="2-Step Evaluation · 100K" />
          </Field>
          <Field label="Countries">
            <input value={form.countries} onChange={(event) => setForm((current) => ({ ...current, countries: event.target.value }))} className={fieldCls} placeholder="Global" />
          </Field>
          <Field label="Account ID">
            <input value={form.accountId} onChange={(event) => setForm((current) => ({ ...current, accountId: event.target.value }))} className={fieldCls} placeholder="5200184" />
          </Field>
          <Field label="Server">
            <input value={form.server} onChange={(event) => setForm((current) => ({ ...current, server: event.target.value }))} className={fieldCls} placeholder="FTMO-Demo" />
          </Field>
          <Field label="Password">
            <input value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className={fieldCls} placeholder="Demo password" />
          </Field>
          <Field label="Investor Password">
            <input value={form.investorPassword} onChange={(event) => setForm((current) => ({ ...current, investorPassword: event.target.value }))} className={fieldCls} placeholder="Read-only password" />
          </Field>
          <Field label="Download / Terminal URL">
            <input value={form.terminalUrl} onChange={(event) => setForm((current) => ({ ...current, terminalUrl: event.target.value }))} className={fieldCls} placeholder="https://..." />
          </Field>
          <Field label="Display Order">
            <input value={form.displayOrder} onChange={(event) => setForm((current) => ({ ...current, displayOrder: event.target.value }))} className={fieldCls} inputMode="numeric" />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as DemoAccountStatus }))} className={selectCls}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes" span={2}>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className={`${fieldCls} min-h-[96px]`}
              placeholder="Anything traders should know before logging in..."
            />
          </Field>
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:col-span-2 md:grid-cols-3">
            <ToggleChip active={form.enabled} label="Published live" onClick={() => setForm((current) => ({ ...current, enabled: !current.enabled }))} />
            <ToggleChip active={form.verified} label="QA verified" onClick={() => setForm((current) => ({ ...current, verified: !current.verified }))} />
            <ToggleChip active={form.hot} label="Hot pick" onClick={() => setForm((current) => ({ ...current, hot: !current.hot }))} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete demo account?"
        message={deleteTarget ? `${deleteTarget.brand} will be removed from the public demo accounts list.` : ""}
        confirmText="Delete"
        tone="danger"
      />
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/5">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</div>
    </div>
  );
}

function IconActionButton({
  icon: Icon,
  label,
  onClick,
  tone = "neutral",
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  tone?: "neutral" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid h-9 w-9 place-items-center rounded-full transition ${
        tone === "danger"
          ? "bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
          : "bg-white/10 text-white hover:bg-white/15"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function ToggleChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ring-1 transition ${
        active
          ? "bg-emerald-500/12 text-emerald-200 ring-emerald-400/30"
          : "bg-white/[0.04] text-white ring-white/10 hover:bg-white/[0.08]"
      }`}
    >
      <span>{label}</span>
      <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10">
        {active ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 text-muted-foreground" />}
      </span>
    </button>
  );
}
