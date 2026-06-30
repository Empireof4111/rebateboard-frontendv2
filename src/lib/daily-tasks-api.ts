import { apiRequest } from "@/lib/api";

const AUTH_STORAGE_KEY = "rb_auth_session";

type StoredSession = {
  token?: string | null;
};

function readToken() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

export type DailyTaskRecord = {
  id: string;
  title: string;
  description: string;
  action: string;
  category: string;
  quantity: number;
  rrReward: number;
  url: string;
  enabled: boolean;
  displayOrder: number;
  completedToday?: boolean;
};

export type DailyTaskAdminBoard = {
  tasks: DailyTaskRecord[];
  stats: {
    activeTasks: number;
    configuredTasks: number;
    usersToday: number;
    completionsToday: number;
    rrAwardedToday: number;
    totalCompletions: number;
  };
  analytics: {
    dailyTrend: {
      label: string;
      completions: number;
      users: number;
      rrAwarded: number;
    }[];
    topTasks: {
      taskId: string;
      title: string;
      completions: number;
      uniqueUsers: number;
      rrAwarded: number;
      enabled: boolean;
    }[];
    recentCompletions: {
      id: string;
      taskTitle: string;
      userName: string;
      rrAwarded: number;
      completionDate: string;
      createdAt: string;
      status: string;
    }[];
    windowStartedAt: string;
  };
};

export type DailyTaskUserBoard = {
  tasks: DailyTaskRecord[];
  stats: {
    total: number;
    completedToday: number;
    remaining: number;
    rrClaimedToday: number;
  };
};

function normalizeTaskPayload(
  task: Partial<DailyTaskRecord> & {
    title: string;
    description: string;
    action: string;
    category: string;
  },
) {
  const { id, ...rest } = task;
  const normalized: Record<string, unknown> = { ...rest };

  if (id && !String(id).startsWith("draft-")) {
    const parsedId = Number(id);
    if (Number.isInteger(parsedId)) {
      normalized.id = parsedId;
    }
  }

  return normalized;
}

export async function fetchDailyTaskAdminBoard() {
  const response = await apiRequest<DailyTaskAdminBoard>("/daily-task/admin/list", {
    method: "GET",
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing daily tasks payload");
  return response.payload;
}

export async function saveDailyTask(task: Partial<DailyTaskRecord> & {
  title: string;
  description: string;
  action: string;
  category: string;
}) {
  const response = await apiRequest<DailyTaskAdminBoard>("/daily-task/admin", {
    method: "POST",
    token: readToken(),
    body: normalizeTaskPayload(task),
  });
  if (!response.payload) throw new Error("Missing daily tasks payload");
  return response.payload;
}

export async function updateDailyTask(taskId: string, task: Partial<DailyTaskRecord> & {
  title: string;
  description: string;
  action: string;
  category: string;
}) {
  const response = await apiRequest<DailyTaskAdminBoard>(`/daily-task/admin/${taskId}`, {
    method: "PUT",
    token: readToken(),
    body: normalizeTaskPayload(task),
  });
  if (!response.payload) throw new Error("Missing daily tasks payload");
  return response.payload;
}

export async function deleteDailyTask(taskId: string) {
  const response = await apiRequest<DailyTaskAdminBoard>(`/daily-task/admin/${taskId}`, {
    method: "DELETE",
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing daily tasks payload");
  return response.payload;
}

export async function resetDailyTasks() {
  const response = await apiRequest<DailyTaskAdminBoard>("/daily-task/admin/reset", {
    method: "POST",
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing daily tasks payload");
  return response.payload;
}

export async function fetchMyDailyTasks() {
  const response = await apiRequest<DailyTaskUserBoard>("/daily-task/my-today", {
    method: "GET",
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing daily tasks payload");
  return response.payload;
}

export async function completeDailyTask(taskId: string, note?: string) {
  const response = await apiRequest<DailyTaskUserBoard>(`/daily-task/${taskId}/complete`, {
    method: "POST",
    token: readToken(),
    body: { note },
  });
  if (!response.payload) throw new Error("Missing daily tasks payload");
  return response.payload;
}
