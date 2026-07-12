import { apiRequest } from "./api";

export type MeritAwardStatus =
  | "disabled"
  | "announcement-soon"
  | "nominations-open"
  | "voting-open"
  | "finalists-published"
  | "winners-published"
  | "archived";

export type MeritAwardSeason = {
  id: number;
  awardYear: string;
  publicStatus: MeritAwardStatus;
  publicVisible: boolean;
  heroTitle: string;
  heroCopy?: string;
  announcementMessage?: string;
  nominationOpensAt?: string | null;
  nominationClosesAt?: string | null;
  votingOpensAt?: string | null;
  votingClosesAt?: string | null;
  finalistsPublishedAt?: string | null;
  winnersPublishedAt?: string | null;
  methodology?: Record<string, unknown>;
  weights?: Record<string, number>;
  judges?: Record<string, unknown>[];
  sponsors?: Record<string, unknown>[];
  createdAt?: string;
  updatedAt?: string;
};

export type MeritAwardCategory = {
  id: number;
  seasonId: number;
  groupName: string;
  name: string;
  description?: string;
  enabled: boolean;
  displayOrder: number;
  criteria?: string[];
};

export type MeritAwardNominee = {
  id: number;
  seasonId: number;
  categoryId: number;
  name: string;
  nomineeType?: string;
  website?: string;
  logoUrl?: string;
  summary?: string;
  status: string;
  finalist: boolean;
  winner: boolean;
  winnerReason?: string;
};

export type MeritAwardNomination = {
  id: number;
  reference: string;
  seasonId: number;
  categoryId: number;
  userId?: number | null;
  nomineeName: string;
  nomineeType?: string;
  website?: string;
  reason: string;
  supportingEvidence?: string;
  contactName?: string;
  contactEmail?: string;
  status: string;
  internalNotes?: string;
  createdAt?: string;
};

export type MeritAwardsBoard = {
  season: MeritAwardSeason;
  categories: MeritAwardCategory[];
  nominees: MeritAwardNominee[];
  nominations?: MeritAwardNomination[];
  votes?: unknown[];
  stats?: {
    categories: number;
    enabledCategories: number;
    nominees: number;
    approvedNominees: number;
    nominations: number;
    pendingNominations: number;
    votes: number;
    winners: number;
  };
};

export type SaveMeritAwardsSettings = Partial<MeritAwardSeason>;
export type SaveMeritAwardCategory = Partial<MeritAwardCategory> & { name: string };
export type SaveMeritAwardNominee = Partial<MeritAwardNominee> & { categoryId: number; name: string };

export async function fetchPublicMeritAwards() {
  const res = await apiRequest<MeritAwardsBoard>("/merit-awards/public");
  return res.payload;
}

export async function fetchAdminMeritAwards(token: string) {
  const res = await apiRequest<MeritAwardsBoard>("/merit-awards/admin/board", { token });
  return res.payload;
}

export async function saveAdminMeritAwardsSettings(token: string, body: SaveMeritAwardsSettings) {
  const res = await apiRequest<MeritAwardSeason>("/merit-awards/admin/settings", {
    method: "PUT",
    token,
    body,
  });
  return res.payload;
}

export async function saveAdminMeritAwardCategory(token: string, body: SaveMeritAwardCategory) {
  const res = await apiRequest<MeritAwardCategory>("/merit-awards/admin/category", {
    method: "POST",
    token,
    body,
  });
  return res.payload;
}

export async function deleteAdminMeritAwardCategory(token: string, id: number) {
  await apiRequest<boolean>(`/merit-awards/admin/category/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function saveAdminMeritAwardNominee(token: string, body: SaveMeritAwardNominee) {
  const res = await apiRequest<MeritAwardNominee>("/merit-awards/admin/nominee", {
    method: "POST",
    token,
    body,
  });
  return res.payload;
}

export async function deleteAdminMeritAwardNominee(token: string, id: number) {
  await apiRequest<boolean>(`/merit-awards/admin/nominee/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function updateAdminMeritAwardNomination(
  token: string,
  id: number,
  body: { status: string; internalNotes?: string },
) {
  const res = await apiRequest<MeritAwardNomination>(`/merit-awards/admin/nomination/${id}`, {
    method: "PUT",
    token,
    body,
  });
  return res.payload;
}
