import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Pill } from "@/components/dashboard/Primitives";
import { useTradingPlan, savePlan, uid, type Strategy, type Session, type MarketType } from "@/lib/trading-plan";
import { Plus, Trash2, Sparkles, Brain, Shield, ListChecks, Save } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/trading-plan")({
  head: () => ({
    meta: [
      { title: "Trading Plan — RebateBoard" },
      { name: "description", content: "Define your trader profile, strategies, rules, and checklist. Enforce discipline." },
    ],
  }),
  component: TradingPlanPage,
});

const SESSIONS: Session[] = ["asia", "london", "ny", "sydney"];
const MARKETS: MarketType[] = ["forex", "crypto", "futures", "stocks", "indices", "commodities"];
const PLAN_TABS = [
  { id: "profile", label: "Profile", helper: "This helps Rebeta understand how you trade." },
  { id: "strategies", label: "Strategies", helper: "Your setups become the benchmark for journal reviews." },
  { id: "rules", label: "Rules", helper: "Risk rules power future guardrail alerts." },
  { id: "psychology", label: "Psychology", helper: "Behavior context improves coaching quality." },
  { id: "checklist", label: "Checklist", helper: "Checklist items become adherence signals." },
] as const;

function TradingPlanPage() {
  const plan = useTradingPlan();
  const [tab, setTab] = useState<(typeof PLAN_TABS)[number]["id"]>("profile");
  const currentIndex = PLAN_TABS.findIndex((item) => item.id === tab);
  const currentTab = PLAN_TABS[currentIndex] ?? PLAN_TABS[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trading Plan"
        subtitle="Plan → Trade → Review → Improve. Your rules, your edge."
        actions={
          <>
            <Pill tone="success"><Save className="h-3 w-3" /> Autosaved</Pill>
            <Pill tone="primary"><Sparkles className="h-3 w-3" /> Updated {new Date(plan.updatedAt).toLocaleDateString()}</Pill>
          </>
        }
      />

      <div className="glass rounded-2xl p-4 ring-1 ring-white/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Step {currentIndex + 1} of {PLAN_TABS.length}
            </div>
            <div className="mt-1 text-sm font-semibold text-white">{currentTab.label}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">{currentTab.helper}</p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10 sm:w-48">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / PLAN_TABS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-full bg-white/5 p-1 text-xs">
        {PLAN_TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1.5 transition ${tab === t.id ? "bg-white/15 text-white" : "text-muted-foreground hover:text-white"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "profile" && <ProfileTab />}
      {tab === "strategies" && <StrategiesTab />}
      {tab === "rules" && <RulesTab />}
      {tab === "psychology" && <PsychologyTab />}
      {tab === "checklist" && <ChecklistTab />}
    </div>
  );
}

function ProfileTab() {
  const plan = useTradingPlan();
  const p = plan.profile ?? { style: "intraday" as const, markets: ["forex"] as MarketType[], experience: "intermediate" as const, sessions: ["london", "ny"] as Session[], riskTolerance: "medium" as const };
  const update = (patch: Partial<typeof p>) => savePlan({ ...plan, profile: { ...p, ...patch } });

  return (
    <Panel title="Trader Profile" action={<Brain className="h-4 w-4 text-fuchsia-300" />}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Trading style">
          <Chips value={p.style} onChange={(v) => update({ style: v as typeof p.style })} options={["scalping", "intraday", "swing", "position"]} />
        </Field>
        <Field label="Experience level">
          <Chips value={p.experience} onChange={(v) => update({ experience: v as typeof p.experience })} options={["beginner", "intermediate", "advanced", "pro"]} />
        </Field>
        <Field label="Markets">
          <Chips multi value={p.markets} onChange={(v) => update({ markets: v as MarketType[] })} options={MARKETS} />
        </Field>
        <Field label="Preferred sessions">
          <Chips multi value={p.sessions} onChange={(v) => update({ sessions: v as Session[] })} options={SESSIONS} />
        </Field>
        <Field label="Risk tolerance">
          <Chips value={p.riskTolerance} onChange={(v) => update({ riskTolerance: v as typeof p.riskTolerance })} options={["low", "medium", "high"]} />
        </Field>
      </div>
    </Panel>
  );
}

function StrategiesTab() {
  const plan = useTradingPlan();
  const add = () => {
    const s: Strategy = {
      id: uid("st"),
      name: "New strategy",
      description: "",
      entryModel: "",
      confirmation: "",
      invalidation: "",
      targetLogic: "",
      riskPerTrade: 1,
      minRR: 2,
    };
    savePlan({ ...plan, strategies: [...plan.strategies, s] });
  };
  const update = (id: string, patch: Partial<Strategy>) => {
    savePlan({ ...plan, strategies: plan.strategies.map((s) => s.id === id ? { ...s, ...patch } : s) });
  };
  const remove = (id: string) => {
    savePlan({ ...plan, strategies: plan.strategies.filter((s) => s.id !== id) });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={add} className="inline-flex items-center gap-1 rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-semibold text-white">
          <Plus className="h-3.5 w-3.5" /> Add strategy
        </button>
      </div>
      {plan.strategies.length === 0 && (
        <Panel title="No strategies yet">
          <p className="text-xs text-muted-foreground">Create your first strategy. Trades reference these to compute plan adherence.</p>
        </Panel>
      )}
      {plan.strategies.map((s) => (
        <Panel key={s.id} title={s.name || "Untitled"} action={
          <button onClick={() => remove(s.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
        }>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Name"><Text value={s.name} onChange={(v) => update(s.id, { name: v })} /></Field>
            <Field label="Risk per trade (%)"><Num value={s.riskPerTrade} step={0.1} onChange={(v) => update(s.id, { riskPerTrade: v })} /></Field>
            <Field label="Description"><Area value={s.description} onChange={(v) => update(s.id, { description: v })} /></Field>
            <Field label="Min RR"><Num value={s.minRR} step={0.1} onChange={(v) => update(s.id, { minRR: v })} /></Field>
            <Field label="Entry model"><Area value={s.entryModel} onChange={(v) => update(s.id, { entryModel: v })} /></Field>
            <Field label="Confirmation rules"><Area value={s.confirmation} onChange={(v) => update(s.id, { confirmation: v })} /></Field>
            <Field label="Invalidation"><Area value={s.invalidation} onChange={(v) => update(s.id, { invalidation: v })} /></Field>
            <Field label="Target logic"><Area value={s.targetLogic} onChange={(v) => update(s.id, { targetLogic: v })} /></Field>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function RulesTab() {
  const plan = useTradingPlan();
  const r = plan.rules;
  const update = (patch: Partial<typeof r>) => savePlan({ ...plan, rules: { ...r, ...patch } });
  return (
    <Panel title="Trading Rules" action={<Shield className="h-4 w-4 text-fuchsia-300" />}>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Max trades per day"><Num value={r.maxTradesPerDay} onChange={(v) => update({ maxTradesPerDay: v })} /></Field>
        <Field label="Max daily loss (%)"><Num value={r.maxDailyLossPct} step={0.1} onChange={(v) => update({ maxDailyLossPct: v })} /></Field>
        <Field label="Max risk per trade (%)"><Num value={r.maxRiskPerTradePct} step={0.1} onChange={(v) => update({ maxRiskPerTradePct: v })} /></Field>
        <Field label="Allowed sessions"><Chips multi value={r.allowedSessions} onChange={(v) => update({ allowedSessions: v as Session[] })} options={SESSIONS} /></Field>
        <Field label="No-trade conditions"><TagList value={r.noTradeConditions} onChange={(v) => update({ noTradeConditions: v })} /></Field>
      </div>
    </Panel>
  );
}

function PsychologyTab() {
  const plan = useTradingPlan();
  const p = plan.psychology;
  const update = (patch: Partial<typeof p>) => savePlan({ ...plan, psychology: { ...p, ...patch } });
  return (
    <Panel title="Psychology Rules" action={<Brain className="h-4 w-4 text-fuchsia-300" />}>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Stop trading after N losses"><Num value={p.stopAfterLosses} onChange={(v) => update({ stopAfterLosses: v })} /></Field>
        <Field label="Emotional triggers"><TagList value={p.emotionalTriggers} onChange={(v) => update({ emotionalTriggers: v })} /></Field>
        <div className="md:col-span-2"><Field label="Behavior restrictions"><TagList value={p.behaviorRestrictions} onChange={(v) => update({ behaviorRestrictions: v })} /></Field></div>
      </div>
    </Panel>
  );
}

function ChecklistTab() {
  const plan = useTradingPlan();
  const update = (id: string, patch: Partial<{ label: string; required: boolean }>) =>
    savePlan({ ...plan, checklist: plan.checklist.map((c) => c.id === id ? { ...c, ...patch } : c) });
  const add = () => savePlan({ ...plan, checklist: [...plan.checklist, { id: uid("ck"), label: "New checklist item", required: false }] });
  const remove = (id: string) => savePlan({ ...plan, checklist: plan.checklist.filter((c) => c.id !== id) });
  return (
    <Panel title="Pre-trade Checklist" action={<ListChecks className="h-4 w-4 text-fuchsia-300" />}>
      <div className="space-y-2">
        {plan.checklist.map((c) => (
          <div key={c.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
            <input value={c.label} onChange={(e) => update(c.id, { label: e.target.value })} className="flex-1 bg-transparent text-sm text-white outline-none" />
            <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <input type="checkbox" checked={c.required} onChange={(e) => update(c.id, { required: e.target.checked })} /> required
            </label>
            <button onClick={() => remove(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <button onClick={add} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white">
          <Plus className="h-3.5 w-3.5" /> Add item
        </button>
      </div>
    </Panel>
  );
}

// shared little inputs
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">{label}</label>{children}</div>;
}
function Text({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-primary/60" />;
}
function Area({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-primary/60" />;
}
function Num({ value, onChange, step }: { value: number; onChange: (v: number) => void; step?: number }) {
  return <input type="number" step={step ?? 1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-primary/60" />;
}
function Chips({ options, value, onChange, multi }: { options: string[]; value: string | string[]; onChange: (v: string | string[]) => void; multi?: boolean }) {
  const arr = Array.isArray(value) ? value : value ? [value] : [];
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = arr.includes(o);
        return (
          <button key={o} type="button" onClick={() => {
            if (multi) { const set = new Set(arr); active ? set.delete(o) : set.add(o); onChange(Array.from(set)); }
            else onChange(active ? "" : o);
          }} className={`rounded-full px-2.5 py-1 text-[11px] capitalize ${active ? "bg-primary/30 text-white ring-1 ring-primary/40" : "bg-white/5 text-muted-foreground"}`}>{o}</button>
        );
      })}
    </div>
  );
}
function TagList({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap gap-1.5">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white">
            {t}
            <button onClick={() => onChange(value.filter((x) => x !== t))} className="text-muted-foreground hover:text-destructive">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => {
          if (e.key === "Enter" && draft.trim()) { onChange([...value, draft.trim()]); setDraft(""); }
        }} placeholder="Add and press Enter" className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white outline-none" />
      </div>
    </div>
  );
}
