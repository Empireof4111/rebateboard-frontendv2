import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCcw, Trash2 } from "lucide-react";
import { PageHeader, Panel, Pill, StatCard } from "@/components/superadmin/AdminUI";
import { toast } from "@/components/superadmin/AdminActions";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  deleteDailyTask,
  fetchDailyTaskAdminBoard,
  resetDailyTasks,
  saveDailyTask,
  updateDailyTask,
  type DailyTaskAdminBoard,
  type DailyTaskRecord,
} from "@/lib/daily-tasks-api";

export const Route = createFileRoute("/superadmin/daily-tasks")({
  component: DailyTasksPage,
});

type TaskAction =
  | "like_post"
  | "share_post"
  | "comment_post"
  | "join_channel"
  | "watch_video"
  | "submit_review";

type TaskCategory =
  | "social"
  | "engagement"
  | "community"
  | "content"
  | "conversion";

const ACTION_OPTIONS: { value: TaskAction; label: string }[] = [
  { value: "like_post", label: "like_post" },
  { value: "share_post", label: "share_post" },
  { value: "comment_post", label: "comment_post" },
  { value: "join_channel", label: "join_channel" },
  { value: "watch_video", label: "watch_video" },
  { value: "submit_review", label: "submit_review" },
];

const CATEGORY_OPTIONS: { value: TaskCategory; label: string }[] = [
  { value: "social", label: "social" },
  { value: "engagement", label: "engagement" },
  { value: "community", label: "community" },
  { value: "content", label: "content" },
  { value: "conversion", label: "conversion" },
];

const CHART_COLORS = ["#7e4dff", "#7e4dff", "#7e4dff", "#06b6d4", "#10b981", "#f59e0b"];

function DailyTasksPage() {
  const [board, setBoard] = useState<DailyTaskAdminBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string>("");

  const tasks = board?.tasks ?? [];
  const metrics = board?.stats ?? {
    activeTasks: 0,
    configuredTasks: 0,
    usersToday: 0,
    completionsToday: 0,
    rrAwardedToday: 0,
    totalCompletions: 0,
  };
  const analytics = board?.analytics ?? {
    dailyTrend: [],
    topTasks: [],
    recentCompletions: [],
    windowStartedAt: "",
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const payload = await fetchDailyTaskAdminBoard();
        if (!cancelled) setBoard(payload);
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Failed to load daily tasks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persistTask(task: DailyTaskRecord) {
    if (savingId === task.id) return;

    try {
      setSavingId(task.id);
      const payload = task.id.startsWith("draft-")
        ? await saveDailyTask(task)
        : await updateDailyTask(task.id, task);
      setBoard(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save task");
    } finally {
      setSavingId("");
    }
  }

  function patchTask<K extends keyof DailyTaskRecord>(id: string, key: K, value: DailyTaskRecord[K]) {
    setBoard((current) => {
      if (!current) return current;
      return {
        ...current,
        tasks: current.tasks.map((task) => (task.id === id ? { ...task, [key]: value } : task)),
      };
    });
  }

  async function addTask() {
    try {
      setSavingId("new-task");
      const payload = await saveDailyTask({
        title: `New task ${tasks.length + 1}`,
        description: "Describe the action users need to complete.",
        action: "like_post",
        category: "social",
        quantity: 1,
        rrReward: 0,
        url: "",
        enabled: true,
        displayOrder: tasks.length,
      });
      setBoard(payload);
      toast.success("New task added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add task");
    } finally {
      setSavingId("");
    }
  }

  async function resetDefaults() {
    try {
      setLoading(true);
      const payload = await resetDailyTasks();
      setBoard(payload);
      toast.success("Daily tasks reset to defaults");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reset tasks");
    } finally {
      setLoading(false);
    }
  }

  async function removeTask(id: string) {
    if (id.startsWith("draft-")) {
      setBoard((current) =>
        current
          ? { ...current, tasks: current.tasks.filter((task) => task.id !== id) }
          : current,
      );
      return;
    }

    try {
      setSavingId(id);
      const payload = await deleteDailyTask(id);
      setBoard(payload);
      toast.success("Daily task removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete task");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Tasks"
        subtitle="Manage rewardable daily actions, activation state, and RR values from one superadmin workspace."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="neutral">{metrics.configuredTasks} configured</Pill>
            <button
              type="button"
              onClick={addTask}
              className="inline-flex items-center gap-2 rounded-full bg-violet-500/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-500/30"
            >
              <Plus className="h-3.5 w-3.5" />
              Add task
            </button>
            <button
              type="button"
              onClick={resetDefaults}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Reset defaults
            </button>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Tasks" value={String(metrics.activeTasks)} delta="Live task definitions" tone="flat" />
        <StatCard label="Users Today" value={String(metrics.usersToday)} delta="Completed at least one task" tone="flat" />
        <StatCard label="Completions Today" value={String(metrics.completionsToday)} delta="All submitted actions" tone="flat" />
        <StatCard label="RR Awarded Today" value={String(metrics.rrAwardedToday)} delta="Rewarded from daily tasks" tone="flat" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Completion trend" action={<Pill tone="neutral">Last 7 days</Pill>}>
          {analytics.dailyTrend.length ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.dailyTrend} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="taskCompletions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7e4dff" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#7e4dff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="taskUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="rgba(255,255,255,0.45)" fontSize={11} />
                  <YAxis yAxisId="left" stroke="rgba(255,255,255,0.45)" fontSize={11} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.45)" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                  <Area yAxisId="left" type="monotone" dataKey="completions" stroke="#7e4dff" strokeWidth={2} fill="url(#taskCompletions)" name="Completions" />
                  <Area yAxisId="right" type="monotone" dataKey="users" stroke="#06b6d4" strokeWidth={2} fill="url(#taskUsers)" name="Users" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-muted-foreground">
              No completion analytics yet.
            </div>
          )}
        </Panel>

        <Panel title="Top performing tasks" action={<Pill tone="good">{analytics.topTasks.length} ranked</Pill>}>
          {analytics.topTasks.length ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topTasks} layout="vertical" margin={{ top: 6, right: 16, left: 4, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.45)" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="title" stroke="rgba(255,255,255,0.6)" fontSize={11} width={130} />
                  <Tooltip contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="completions" radius={[0, 10, 10, 0]} name="Completions">
                    {analytics.topTasks.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-muted-foreground">
              Task rankings will appear once users start completing actions.
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Top task breakdown">
          {analytics.topTasks.length ? (
            <div className="space-y-3">
              {analytics.topTasks.map((task) => (
                <div key={task.taskId} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{task.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {task.uniqueUsers} users · {task.rrAwarded} RR awarded
                      </div>
                    </div>
                    <Pill tone={task.enabled ? "good" : "neutral"}>
                      {task.completions} completions
                    </Pill>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-muted-foreground">
              No task breakdown available yet.
            </div>
          )}
        </Panel>

        <Panel title="Recent completions">
          {analytics.recentCompletions.length ? (
            <div className="space-y-3">
              {analytics.recentCompletions.map((completion) => (
                <div key={completion.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{completion.taskTitle}</div>
                      <div className="text-xs text-muted-foreground">
                        {completion.userName} · {completion.completionDate}
                      </div>
                    </div>
                    <Pill tone="good">{completion.rrAwarded} RR</Pill>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-muted-foreground">
              Recent task completions will show here once users start claiming them.
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Tasks" action={<Pill tone="good">Task engine</Pill>}>
        <div className="space-y-3">
          {loading && tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-muted-foreground">
              Loading daily task engine...
            </div>
          ) : null}
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 ring-1 ring-white/5"
            >
              <div className="grid gap-2 md:grid-cols-[1.1fr_1.6fr_1fr_1fr_0.7fr_0.7fr_auto]">
                  <input
                    value={task.title}
                    onChange={(event) => patchTask(task.id, "title", event.target.value)}
                    onBlur={() => void persistTask(task)}
                    className={fieldClassName}
                    placeholder="Task title"
                  />
                  <input
                    value={task.description}
                    onChange={(event) => patchTask(task.id, "description", event.target.value)}
                    onBlur={() => void persistTask(task)}
                    className={fieldClassName}
                    placeholder="Task description"
                  />
                  <select
                    value={task.action}
                    onChange={(event) => {
                      patchTask(task.id, "action", event.target.value as TaskAction);
                      void persistTask({ ...task, action: event.target.value as TaskAction });
                    }}
                    className={fieldClassName}
                  >
                  {ACTION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[var(--rb-bg-elevated)] text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
                  <select
                    value={task.category}
                    onChange={(event) => {
                      patchTask(task.id, "category", event.target.value as TaskCategory);
                      void persistTask({ ...task, category: event.target.value as TaskCategory });
                    }}
                    className={fieldClassName}
                  >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[var(--rb-bg-elevated)] text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
                  <input
                    type="number"
                    min={1}
                    value={task.quantity}
                    onChange={(event) => patchTask(task.id, "quantity", Number(event.target.value) || 1)}
                    onBlur={() => void persistTask(task)}
                    className={fieldClassName}
                    placeholder="Qty"
                  />
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    RR
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={task.rrReward}
                    onChange={(event) => patchTask(task.id, "rrReward", Number(event.target.value) || 0)}
                    onBlur={() => void persistTask(task)}
                    className={`${fieldClassName} pl-10`}
                    placeholder="Reward"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">/D</span>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <span className={`text-xs font-semibold ${task.enabled ? "text-sky-300" : "text-muted-foreground"}`}>
                      {task.enabled ? "on" : "off"}
                    </span>
                    <input
                      type="checkbox"
                      checked={task.enabled}
                      onChange={(event) => {
                        patchTask(task.id, "enabled", event.target.checked);
                        void persistTask({ ...task, enabled: event.target.checked });
                      }}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 accent-sky-500"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    disabled={savingId === task.id}
                    className="grid h-7 w-7 place-items-center rounded-full bg-rose-500/10 text-rose-300 transition hover:bg-rose-500/20"
                    aria-label={`Delete ${task.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-2">
                <input
                  value={task.url}
                  onChange={(event) => patchTask(task.id, "url", event.target.value)}
                  onBlur={() => void persistTask(task)}
                  className={fieldClassName}
                  placeholder="Task link"
                />
              </div>
            </div>
          ))}
          {!loading && tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-muted-foreground">
              No daily tasks configured yet.
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

const fieldClassName =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-muted-foreground focus:border-violet-400/40 focus:bg-white/[0.07]";
