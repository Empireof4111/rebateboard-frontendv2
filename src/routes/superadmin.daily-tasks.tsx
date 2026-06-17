import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RefreshCcw, Trash2 } from "lucide-react";
import { PageHeader, Panel, Pill, StatCard } from "@/components/superadmin/AdminUI";

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

type DailyTaskRow = {
  id: string;
  title: string;
  description: string;
  action: TaskAction;
  category: TaskCategory;
  quantity: number;
  rrReward: number;
  url: string;
  enabled: boolean;
};

const DEFAULT_TASKS: DailyTaskRow[] = [
  {
    id: "task-1",
    title: "Like today's post",
    description: "Tap the heart on our latest Instagram post",
    action: "like_post",
    category: "social",
    quantity: 2,
    rrReward: 5,
    url: "https://instagram.com/rebateboard",
    enabled: true,
  },
  {
    id: "task-2",
    title: "Share a post",
    description: "Repost any RebateBoard update to your story",
    action: "share_post",
    category: "social",
    quantity: 5,
    rrReward: 3,
    url: "https://instagram.com/rebateboard",
    enabled: true,
  },
  {
    id: "task-3",
    title: "Comment on a post",
    description: "Drop a meaningful comment on our latest post",
    action: "comment_post",
    category: "engagement",
    quantity: 3,
    rrReward: 3,
    url: "https://instagram.com/rebateboard",
    enabled: true,
  },
  {
    id: "task-4",
    title: "Join Telegram channel",
    description: "Enter the official channel and stay subscribed",
    action: "join_channel",
    category: "community",
    quantity: 1,
    rrReward: 8,
    url: "https://t.me/rebateboard",
    enabled: false,
  },
  {
    id: "task-5",
    title: "Watch education reel",
    description: "Watch the latest short-form market education video",
    action: "watch_video",
    category: "content",
    quantity: 1,
    rrReward: 4,
    url: "https://youtube.com/@rebateboard",
    enabled: true,
  },
  {
    id: "task-6",
    title: "Submit a verified review",
    description: "Complete one trader review with valid proof of use",
    action: "submit_review",
    category: "conversion",
    quantity: 1,
    rrReward: 15,
    url: "https://rebateboard.com/reviews",
    enabled: false,
  },
];

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

function DailyTasksPage() {
  const [tasks, setTasks] = useState<DailyTaskRow[]>(DEFAULT_TASKS);

  const metrics = useMemo(() => {
    return {
      activeTasks: tasks.length,
      usersToday: 0,
      completionsToday: 0,
      rrAwardedToday: 0,
    };
  }, [tasks]);

  function updateTask<K extends keyof DailyTaskRow>(id: string, key: K, value: DailyTaskRow[K]) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, [key]: value } : task)),
    );
  }

  function resetDefaults() {
    setTasks(DEFAULT_TASKS);
  }

  function removeTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Tasks"
        subtitle="Manage rewardable daily actions, activation state, and RR values from one superadmin workspace."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="neutral">{tasks.length} configured</Pill>
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

      <Panel title="Tasks" action={<Pill tone="good">Task engine</Pill>}>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 ring-1 ring-white/5"
            >
              <div className="grid gap-2 md:grid-cols-[1.1fr_1.6fr_1fr_1fr_0.7fr_0.7fr_auto]">
                <input
                  value={task.title}
                  onChange={(event) => updateTask(task.id, "title", event.target.value)}
                  className={fieldClassName}
                  placeholder="Task title"
                />
                <input
                  value={task.description}
                  onChange={(event) => updateTask(task.id, "description", event.target.value)}
                  className={fieldClassName}
                  placeholder="Task description"
                />
                <select
                  value={task.action}
                  onChange={(event) => updateTask(task.id, "action", event.target.value as TaskAction)}
                  className={fieldClassName}
                >
                  {ACTION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#150829] text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={task.category}
                  onChange={(event) => updateTask(task.id, "category", event.target.value as TaskCategory)}
                  className={fieldClassName}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#150829] text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={task.quantity}
                  onChange={(event) => updateTask(task.id, "quantity", Number(event.target.value) || 1)}
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
                    onChange={(event) => updateTask(task.id, "rrReward", Number(event.target.value) || 0)}
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
                      onChange={(event) => updateTask(task.id, "enabled", event.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 accent-sky-500"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
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
                  onChange={(event) => updateTask(task.id, "url", event.target.value)}
                  className={fieldClassName}
                  placeholder="Task link"
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

const fieldClassName =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-muted-foreground focus:border-fuchsia-400/40 focus:bg-white/[0.07]";
