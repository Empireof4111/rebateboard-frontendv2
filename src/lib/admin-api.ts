import { apiRequest, type ApiResponse } from "./api";

// ─── Pagination ────────────────────────────────────────────────────────────
export type PaginatedResult<T> = {
  page: T[];
  size: number;
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  stats?: {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    pendingUsers: number;
    suspendedUsers: number;
    adminUsers: number;
  };
};

// ─── Blog ──────────────────────────────────────────────────────────────────
export type BlogPost = {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  authorTitle: string;
  views: string;
  status: "draft" | "published";
  time: string;
  cover: string;
  body: string;
  tag: string;
  excerpt: string;
  readTime: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  urlSlug: string;
};

const DEFAULT_EDITOR_NAME = "RebateBoard Editorial";
const DEFAULT_EDITOR_TITLE = "Editorial Team";

function cleanEditorName(value?: unknown) {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name || /^User\s*#/i.test(name)) return DEFAULT_EDITOR_NAME;
  return name;
}

function firstEditorText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function mapBlog(raw: any): BlogPost {
  const metadata = record(raw.metadata);
  const authorName = firstEditorText(
    raw.authorName,
    raw.author,
    metadata.authorName,
    metadata.editorName,
    raw.createdBy?.name,
  );
  return {
    id: String(raw.id),
    title: raw.title ?? "",
    author: cleanEditorName(authorName),
    authorAvatar: firstEditorText(
      raw.authorAvatar,
      raw.editorAvatar,
      metadata.authorAvatar,
      metadata.editorAvatar,
      raw.createdBy?.avatar,
      raw.createdBy?.profilePicture,
      raw.createdBy?.photo,
    ),
    authorTitle: firstEditorText(raw.authorTitle, metadata.authorTitle, metadata.editorTitle) || DEFAULT_EDITOR_TITLE,
    views: String(raw.likes ?? 0),
    status: raw.status === "ACTIVE" ? "published" : "draft",
    time: raw.updatedAt ?? raw.createdAt ?? "",
    cover: firstEditorText(
      raw.thumbnail,
      raw.cover,
      raw.coverImage,
      raw.coverUrl,
      raw.image,
      raw.imageUrl,
      metadata.thumbnail,
      metadata.cover,
      metadata.coverImage,
      metadata.image,
    ),
    body: raw.description ?? "",
    tag: raw.category ?? "",
    excerpt: raw.shortDescription ?? "",
    readTime: raw.subCategory ?? "",
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    seoTitle: raw.seoTitle ?? "",
    seoDescription: raw.seoDescription ?? "",
    urlSlug: raw.urlSlug ?? "",
  };
}

function blogToDto(post: Partial<BlogPost>) {
  return {
    title: post.title,
    category: post.tag,
    subCategory: post.readTime,
    description: post.body,
    shortDescription: post.excerpt,
    thumbnail: post.cover,
    authorName: cleanEditorName(post.author),
    authorAvatar: post.authorAvatar,
    authorTitle: post.authorTitle,
    status: post.status === "published" ? "ACTIVE" : "INACTIVE",
    tags: post.tags ?? [],
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    urlSlug: post.urlSlug,
  };
}

export const blogApi = {
  async list(token: string, page = 0, size = 100): Promise<ApiResponse<PaginatedResult<BlogPost>>> {
    const res = await apiRequest<any>(`/blog/list?page=${page}&size=${size}`, { token });
    if (res.payload) {
      res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapBlog) };
    }
    return res as any;
  },
  async search(token: string, q: string): Promise<ApiResponse<PaginatedResult<BlogPost>>> {
    const res = await apiRequest<any>(`/blog/search?q=${encodeURIComponent(q)}&size=100`, {
      token,
    });
    if (res.payload) {
      res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapBlog) };
    }
    return res as any;
  },
  async create(token: string, data: Partial<BlogPost>): Promise<ApiResponse<BlogPost>> {
    const res = await apiRequest<any>("/blog/", { method: "POST", token, body: blogToDto(data) });
    if (res.payload) res.payload = mapBlog(res.payload);
    return res as any;
  },
  async update(token: string, id: string, data: Partial<BlogPost>): Promise<ApiResponse<BlogPost>> {
    const res = await apiRequest<any>(`/blog/${id}`, {
      method: "PUT",
      token,
      body: { ...blogToDto(data), status: data.status === "published" ? "ACTIVE" : "INACTIVE" },
    });
    if (res.payload) res.payload = mapBlog(res.payload);
    return res as any;
  },
  async remove(token: string, id: string): Promise<ApiResponse<void>> {
    return apiRequest(`/blog/${id}`, { method: "DELETE", token });
  },
};

export function articleRouteId(post: Pick<BlogPost, "id" | "urlSlug">) {
  return post.urlSlug?.trim() || post.id;
}

export async function fetchPublicBlogPosts(page = 0, size = 100): Promise<BlogPost[]> {
  try {
    const res = await apiRequest<PaginatedResult<any>>(`/blog/list?page=${page}&size=${size}`, {
      cache: "no-store",
    });
    return (res.payload?.page ?? []).map(mapBlog).filter((post) => post.status === "published");
  } catch {
    return [];
  }
}

export async function fetchPublicBlogPost(idOrSlug: string): Promise<BlogPost | null> {
  const lookup = idOrSlug.trim();

  if (/^\d+$/.test(lookup)) {
    try {
      const res = await apiRequest<any>(`/blog/detail/${lookup}`, { cache: "no-store" });
      const post = res.payload ? mapBlog(res.payload) : null;
      if (post?.status === "published") return post;
    } catch {
      // Fall back to the public list below so slug and stale detail paths both work.
    }
  }

  const posts = await fetchPublicBlogPosts();
  return posts.find((post) => post.id === lookup || post.urlSlug === lookup) ?? null;
}

// ─── News ──────────────────────────────────────────────────────────────────
export type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  status: "draft" | "published";
  published: string;
  author: string;
  authorAvatar: string;
  authorTitle: string;
  thumbnail: string;
};

function mapNews(raw: any): NewsItem {
  const metadata = record(raw.metadata);
  const authorName = firstEditorText(
    raw.authorName,
    raw.author,
    metadata.authorName,
    metadata.editorName,
    raw.createdBy?.name,
  );
  return {
    id: String(raw.id),
    title: raw.title ?? "",
    excerpt: raw.description ?? "",
    status: raw.status === "ACTIVE" ? "published" : "draft",
    published: raw.createdAt ?? "",
    author: cleanEditorName(authorName),
    authorAvatar: firstEditorText(
      raw.authorAvatar,
      raw.editorAvatar,
      metadata.authorAvatar,
      metadata.editorAvatar,
      raw.createdBy?.avatar,
      raw.createdBy?.profilePicture,
      raw.createdBy?.photo,
    ),
    authorTitle: firstEditorText(raw.authorTitle, metadata.authorTitle, metadata.editorTitle) || DEFAULT_EDITOR_TITLE,
    thumbnail: raw.thumbnail ?? "",
  };
}

function newsToDto(data: Partial<NewsItem>) {
  return {
    title: data.title,
    description: data.excerpt,
    thumbnail: data.thumbnail,
    authorName: cleanEditorName(data.author),
    authorAvatar: data.authorAvatar,
    authorTitle: data.authorTitle,
    status: data.status === "published" ? "ACTIVE" : "INACTIVE",
  };
}

export const newsApi = {
  async list(token: string, page = 0, size = 100): Promise<ApiResponse<PaginatedResult<NewsItem>>> {
    const res = await apiRequest<any>(`/news/list?page=${page}&size=${size}`, { token });
    if (res.payload) res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapNews) };
    return res as any;
  },
  async create(token: string, data: Partial<NewsItem>): Promise<ApiResponse<NewsItem>> {
    const res = await apiRequest<any>("/news/", {
      method: "POST",
      token,
      body: newsToDto(data),
    });
    if (res.payload) res.payload = mapNews(res.payload);
    return res as any;
  },
  async update(token: string, id: string, data: Partial<NewsItem>): Promise<ApiResponse<NewsItem>> {
    const res = await apiRequest<any>(`/news/${id}`, {
      method: "PUT",
      token,
      body: newsToDto(data),
    });
    if (res.payload) res.payload = mapNews(res.payload);
    return res as any;
  },
  async remove(token: string, id: string): Promise<ApiResponse<void>> {
    return apiRequest(`/news/${id}`, { method: "DELETE", token });
  },
};

// ─── FAQ ───────────────────────────────────────────────────────────────────
export type Faq = {
  id: string;
  category: string;
  question: string;
  answer: string;
  status: "draft" | "published";
  updated: string;
  views: number;
};

function mapFaq(raw: any): Faq {
  return {
    id: String(raw.id),
    category: raw.category ?? "General",
    question: raw.title ?? "",
    answer: raw.description ?? "",
    status: raw.status === "ACTIVE" ? "published" : "draft",
    updated: raw.updatedAt ?? raw.createdAt ?? "",
    views: Number(raw.likes ?? 0),
  };
}

export const faqApi = {
  async list(token: string, page = 0, size = 200): Promise<ApiResponse<PaginatedResult<Faq>>> {
    const res = await apiRequest<any>(`/faq/list?page=${page}&size=${size}`, { token });
    if (res.payload) res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapFaq) };
    return res as any;
  },
  async search(token: string, q: string): Promise<ApiResponse<PaginatedResult<Faq>>> {
    const res = await apiRequest<any>(`/faq/search?q=${encodeURIComponent(q)}&size=200`, { token });
    if (res.payload) res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapFaq) };
    return res as any;
  },
  async create(token: string, data: Partial<Faq>): Promise<ApiResponse<Faq>> {
    const res = await apiRequest<any>("/faq/", {
      method: "POST",
      token,
      body: {
        title: data.question,
        description: data.answer,
        category: data.category,
        status: data.status === "published" ? "ACTIVE" : "INACTIVE",
      },
    });
    if (res.payload) res.payload = mapFaq(res.payload);
    return res as any;
  },
  async update(token: string, id: string, data: Partial<Faq>): Promise<ApiResponse<Faq>> {
    const res = await apiRequest<any>(`/faq/${id}`, {
      method: "PUT",
      token,
      body: {
        title: data.question,
        description: data.answer,
        category: data.category,
        status: data.status === "published" ? "ACTIVE" : "INACTIVE",
      },
    });
    if (res.payload) res.payload = mapFaq(res.payload);
    return res as any;
  },
  async remove(token: string, id: string): Promise<ApiResponse<void>> {
    return apiRequest(`/faq/${id}`, { method: "DELETE", token });
  },
};

export async function fetchPublicFaqs(page = 0, size = 200): Promise<Faq[]> {
  try {
    const res = await apiRequest<PaginatedResult<any>>(`/faq/list?page=${page}&size=${size}`, {
      cache: "no-store",
    });
    return (res.payload?.page ?? []).map(mapFaq).filter((faq) => faq.status === "published");
  } catch {
    return [];
  }
}

// ─── Announcement ──────────────────────────────────────────────────────────
export type Announcement = {
  id: string;
  category: "Global" | "Brand";
  message: string;
  cta: string;
  link: string;
  placement: string;
  source: string;
  approval: "approved" | "pending" | "rejected";
  start: string;
  end: string;
  status: "scheduled" | "active" | "expired";
  brandId?: string;
  brandName?: string;
  submittedBy?: string;
};

function mapAnnouncement(raw: any): Announcement {
  const statusMap: Record<string, Announcement["status"]> = {
    ACTIVE: "active",
    INACTIVE: "scheduled",
    REVOKED: "expired",
    DELETED: "expired",
  };
  return {
    id: String(raw.id),
    category: raw.category === "Brand" ? "Brand" : "Global",
    message: raw.description ?? "",
    cta: raw.actionText ?? "",
    link: raw.actionURL ?? "",
    placement: raw.placement ?? "Dashboard",
    source: raw.source ?? "Admin",
    approval: (raw.approval as any) ?? "approved",
    start: raw.startAt ?? "",
    end: raw.endAt ?? "",
    status: statusMap[raw.status] ?? "active",
    brandId: raw.brandId ?? "",
    brandName: raw.brandName ?? "",
    submittedBy: raw.createdBy?.name,
  };
}

function announcementToDto(data: Partial<Announcement>) {
  const statusMap: Record<string, string> = {
    active: "ACTIVE",
    scheduled: "INACTIVE",
    expired: "REVOKED",
  };
  return {
    title: data.message?.slice(0, 80) ?? "Announcement",
    description: data.message,
    actionText: data.cta,
    actionURL: data.link,
    category: data.category,
    placement: data.placement,
    source: data.source,
    approval: data.approval,
    startAt: data.start,
    endAt: data.end,
    brandId: data.brandId,
    brandName: data.brandName,
    status: data.status ? statusMap[data.status] : undefined,
  };
}

export const announcementApi = {
  async list(
    token: string,
    page = 0,
    size = 200,
  ): Promise<ApiResponse<PaginatedResult<Announcement>>> {
    const res = await apiRequest<any>(`/announcement/list?page=${page}&size=${size}`, { token });
    if (res.payload)
      res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapAnnouncement) };
    return res as any;
  },
  async create(token: string, data: Partial<Announcement>): Promise<ApiResponse<Announcement>> {
    const res = await apiRequest<any>("/announcement/", {
      method: "POST",
      token,
      body: announcementToDto(data),
    });
    if (res.payload) res.payload = mapAnnouncement(res.payload);
    return res as any;
  },
  async update(
    token: string,
    id: string,
    data: Partial<Announcement>,
  ): Promise<ApiResponse<Announcement>> {
    const res = await apiRequest<any>(`/announcement/${id}`, {
      method: "PUT",
      token,
      body: announcementToDto(data),
    });
    if (res.payload) res.payload = mapAnnouncement(res.payload);
    return res as any;
  },
  async remove(token: string, id: string): Promise<ApiResponse<void>> {
    return apiRequest(`/announcement/${id}`, { method: "DELETE", token });
  },
};

export async function fetchPublicAnnouncements(page = 0, size = 200): Promise<Announcement[]> {
  try {
    const res = await apiRequest<PaginatedResult<any>>(
      `/announcement/list?page=${page}&size=${size}`,
      { cache: "no-store" },
    );
    return (res.payload?.page ?? [])
      .map(mapAnnouncement)
      .filter((announcement) => announcement.status === "active");
  } catch {
    return [];
  }
}

// ─── Users (Admin) ─────────────────────────────────────────────────────────
export type AdminUser = {
  id: string;
  name: string;
  email: string;
  country: string;
  joined: string;
  verified: boolean;
  banned: boolean;
  role: string;
  status: string;
};

function mapUser(raw: any): AdminUser {
  return {
    id: String(raw.id),
    name: raw.name ?? "",
    email: raw.emailAddress ?? "",
    country: raw.country ?? "",
    joined: raw.createdAt ?? "",
    verified: Number(raw.kycLevel ?? 0) > 0 || Number(raw.verified ?? 0) === 1,
    banned: raw.status === "SUSPENDED",
    role: raw.role ?? "USER",
    status: raw.status ?? "ACTIVE",
  };
}

export const userAdminApi = {
  async list(
    token: string,
    page = 0,
    size = 50,
    filters?: { status?: string; verified?: number },
  ): Promise<ApiResponse<PaginatedResult<AdminUser>>> {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (filters?.status) params.set("status", filters.status);
    if (filters?.verified !== undefined) params.set("verified", String(filters.verified));
    const res = await apiRequest<any>(`/user/list?${params.toString()}`, { token });
    if (res.payload) res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapUser) };
    return res as any;
  },
  async search(
    token: string,
    q: string,
    page = 0,
    size = 50,
    filters?: { status?: string; verified?: number },
  ): Promise<ApiResponse<PaginatedResult<AdminUser>>> {
    const params = new URLSearchParams({
      q: q,
      page: String(page),
      size: String(size),
    });
    if (filters?.status) params.set("status", filters.status);
    if (filters?.verified !== undefined) params.set("verified", String(filters.verified));
    const res = await apiRequest<any>(`/user/search?${params.toString()}`, { token });
    if (res.payload) res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapUser) };
    return res as any;
  },
  async updateStatus(
    token: string,
    userId: string,
    status: string,
  ): Promise<ApiResponse<AdminUser>> {
    const res = await apiRequest<any>(`/user/status-change/${userId}`, {
      method: "PUT",
      token,
      body: { status },
    });
    if (res.payload) res.payload = mapUser(res.payload);
    return res as any;
  },
  async update(
    token: string,
    userId: string,
    data: Partial<AdminUser>,
  ): Promise<ApiResponse<AdminUser>> {
    const res = await apiRequest<any>(`/user/${userId}`, {
      method: "PUT",
      token,
      body: { name: data.name, emailAddress: data.email, country: data.country },
    });
    if (res.payload) res.payload = mapUser(res.payload);
    return res as any;
  },
  async remove(token: string, userId: string): Promise<ApiResponse<void>> {
    return apiRequest(`/user/${userId}`, { method: "DELETE", token });
  },
};

// ─── Subscribers ───────────────────────────────────────────────────────────
export type Subscriber = {
  id: string;
  email: string;
  name?: string;
  source: string;
  status: "active" | "unsubscribed" | "bounced";
  subscribed: string;
};

function mapSubscriber(raw: any): Subscriber {
  const statusMap: Record<string, Subscriber["status"]> = {
    ACTIVE: "active",
    INACTIVE: "unsubscribed",
    BLOCKED: "bounced",
  };
  return {
    id: String(raw.id),
    email: raw.emailAddress ?? "",
    name: raw.name ?? undefined,
    source: raw.source ?? "Footer",
    status: statusMap[raw.status] ?? "active",
    subscribed: raw.createdAt ?? "",
  };
}

export const subscriberApi = {
  async list(
    token: string,
    page = 0,
    size = 200,
  ): Promise<ApiResponse<PaginatedResult<Subscriber>>> {
    const res = await apiRequest<any>(`/news/subscription/list?page=${page}&size=${size}`, {
      token,
    });
    if (res.payload)
      res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapSubscriber) };
    return res as any;
  },
  async search(token: string, q: string): Promise<ApiResponse<PaginatedResult<Subscriber>>> {
    const res = await apiRequest<any>(
      `/news/subscription/search?q=${encodeURIComponent(q)}&size=200`,
      { token },
    );
    if (res.payload)
      res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapSubscriber) };
    return res as any;
  },
  async add(
    token: string,
    email: string,
    name?: string,
    source?: string,
  ): Promise<ApiResponse<Subscriber>> {
    const res = await apiRequest<any>("/news/subscribe", {
      method: "POST",
      token,
      body: { emailAddress: email, name, source },
    });
    if (res.payload) res.payload = mapSubscriber(res.payload);
    return res as any;
  },
};

// ─── Adverts ───────────────────────────────────────────────────────────────
export type DashboardAd = {
  id: string;
  name: string;
  format: "marquee" | "single" | "carousel" | "trending";
  placement: "dashboard" | "landing-hero" | "landing-sponsors" | "landing-advertise" | "homepage-video" | "economic-calendar";
  active: boolean;
  priority: number;
  headline: string;
  sub?: string;
  description?: string;
  cta?: string;
  href: string;
  accent: string;
  thumbnail?: string;
  image?: string;
  videoUrl?: string;
  slides?: any[];
  sponsors?: any[];
  trendingLimit?: number;
  impressions: number;
  clicks: number;
  createdAt: string;
  startAt?: string;
  endAt?: string;
};

function record(value: unknown): Record<string, any> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const next = cleanText(value);
    if (next) return next;
  }
  return "";
}

function normalizeAdFormat(value: unknown): DashboardAd["format"] {
  const raw = cleanText(value).toLowerCase();
  if (raw === "marquee" || raw === "single" || raw === "carousel" || raw === "trending") {
    return raw;
  }
  if (raw === "banner" || raw === "card" || raw === "top" || raw === "sidebar") {
    return "single";
  }
  return "single";
}

function normalizeAdPlacement(value: unknown): DashboardAd["placement"] {
  const raw = cleanText(value);
  if (
    raw === "dashboard" ||
    raw === "landing-hero" ||
    raw === "landing-sponsors" ||
    raw === "landing-advertise" ||
    raw === "homepage-video" ||
    raw === "economic-calendar"
  ) {
    return raw;
  }
  return "dashboard";
}

function looksLikeAdHref(value: string) {
  return (
    value.startsWith("/") ||
    value.startsWith("#") ||
    /^https?:\/\//i.test(value) ||
    /^mailto:/i.test(value)
  );
}

function normalizeAdvertSlide(slide: unknown) {
  const row = record(slide);
  return {
    ...row,
    label: firstText(row.label, row.title, row.name, row.headline) || "Featured",
    sub: firstText(row.sub, row.subtitle, row.description, row.excerpt) || undefined,
    href: firstText(row.href, row.url, row.link) || "/blog",
    image:
      firstText(row.image, row.thumbnail, row.cover, row.coverUrl, row.imageUrl, row.logo) ||
      undefined,
  };
}

function normalizeAdvertSponsor(sponsor: unknown) {
  const row = record(sponsor);
  const name = firstText(row.name, row.label, row.title) || "Brand";
  return {
    ...row,
    id: firstText(row.id, row.brandSlug, row.slug, name) || name,
    name,
    initial: firstText(row.initial, row.initials) || undefined,
    logo:
      firstText(row.logo, row.image, row.thumbnail, row.cover, row.imageUrl) ||
      undefined,
    href: firstText(row.href, row.url, row.link) || undefined,
  };
}

function mapAdvert(raw: any): DashboardAd {
  const meta = record(raw.metadata);
  const thumbnail = firstText(raw.thumbnail, meta.image, meta.thumbnail, meta.cover, raw.image);
  const action = firstText(raw.action);
  const cta = firstText(meta.cta, looksLikeAdHref(action) ? "" : action);
  const href = firstText(meta.href, raw.href, looksLikeAdHref(action) ? action : "");
  return {
    id: String(raw.id),
    name: raw.title ?? meta.name ?? "",
    format: normalizeAdFormat(meta.format),
    placement: normalizeAdPlacement(meta.placement ?? raw.page),
    active: raw.active !== false,
    priority: Number(raw.priority ?? 0),
    headline: meta.headline ?? "",
    sub: raw.subTitle ?? meta.sub,
    description: raw.description ?? meta.description,
    cta,
    href,
    videoUrl: firstText(meta.videoUrl, raw.videoUrl, looksLikeAdHref(action) ? action : ""),
    accent: meta.accent ?? "from-violet-500 to-violet-600",
    thumbnail,
    image: thumbnail,
    slides: Array.isArray(meta.slides) ? meta.slides.map(normalizeAdvertSlide) : [],
    sponsors: Array.isArray(meta.sponsors) ? meta.sponsors.map(normalizeAdvertSponsor) : [],
    trendingLimit: meta.trendingLimit,
    impressions: Number(raw.impressions ?? 0),
    clicks: Number(raw.clicks ?? 0),
    createdAt: raw.createdAt ?? "",
    startAt: raw.startAt,
    endAt: raw.endAt,
  };
}

function advertToDto(data: Partial<DashboardAd>) {
  const thumbnail = data.thumbnail ?? data.image ?? "";
  return {
    title: data.name ?? data.headline ?? "Draft banner",
    subTitle: data.sub,
    description: data.description,
    thumbnail,
    page: data.placement,
    action: data.cta,
    priority: data.priority,
    active: data.active,
    startAt: data.startAt,
    endAt: data.endAt,
    metadata: {
      format: data.format,
      placement: data.placement,
      accent: data.accent,
      headline: data.headline,
      image: thumbnail,
      thumbnail,
      href: data.href,
      cta: data.cta,
      sub: data.sub,
      description: data.description,
      videoUrl: data.videoUrl,
      slides: data.slides,
      sponsors: data.sponsors,
      trendingLimit: data.trendingLimit,
    },
  };
}

function emitDashboardAdsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("rb:dashboard-ads"));
  }
}

export const advertApi = {
  async list(
    token: string,
    page = 0,
    size = 100,
  ): Promise<ApiResponse<PaginatedResult<DashboardAd>>> {
    const res = await apiRequest<any>(`/advert/list?page=${page}&size=${size}`, { token });
    if (res.payload)
      res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapAdvert) };
    return res as any;
  },
  async create(token: string, data: Partial<DashboardAd>): Promise<ApiResponse<DashboardAd>> {
    const res = await apiRequest<any>("/advert/", {
      method: "POST",
      token,
      body: advertToDto(data),
    });
    if (res.payload) {
      res.payload = mapAdvert(res.payload);
      emitDashboardAdsChanged();
    }
    return res as any;
  },
  async update(
    token: string,
    id: string,
    data: Partial<DashboardAd>,
  ): Promise<ApiResponse<DashboardAd>> {
    const res = await apiRequest<any>(`/advert/${id}`, {
      method: "PUT",
      token,
      body: advertToDto(data),
    });
    if (res.payload) {
      res.payload = mapAdvert(res.payload);
      emitDashboardAdsChanged();
    }
    return res as any;
  },
  async remove(token: string, id: string): Promise<ApiResponse<void>> {
    const res = await apiRequest(`/advert/${id}`, { method: "DELETE", token });
    emitDashboardAdsChanged();
    return res;
  },
};

// Users support / inbox messages
export type AdminInboxMessage = {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phoneNumber: string;
  subject: string;
  preview: string;
  message: string;
  status: string;
  received: string;
  updatedAt: string;
  replyCount: number;
  lastReply?: {
    subject: string;
    message: string;
  } | null;
};

function mapInboxMessage(raw: any): AdminInboxMessage {
  const replies = Array.isArray(raw.replies) ? raw.replies : [];
  const lastReply = replies.length ? replies[replies.length - 1] : null;
  return {
    id: String(raw.id),
    userId: raw.userId ? String(raw.userId) : undefined,
    name: raw.name ?? "Unknown sender",
    email: raw.emailAddress ?? "",
    phoneNumber: raw.phoneNumber ?? "",
    subject: raw.subject ?? "",
    preview: raw.message ?? "",
    message: raw.message ?? "",
    status: raw.status ?? "PENDING",
    received: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? raw.createdAt ?? "",
    replyCount: replies.length,
    lastReply: lastReply
      ? {
          subject: lastReply.subject ?? "",
          message: lastReply.message ?? "",
        }
      : null,
  };
}

export type AdminInboxStats = {
  total: number;
  pending: number;
  open: number;
  replied: number;
  closed: number;
};

export const inboxAdminApi = {
  async list(
    token: string,
    page = 0,
    size = 50,
  ): Promise<ApiResponse<PaginatedResult<AdminInboxMessage> & { stats?: AdminInboxStats }>> {
    const res = await apiRequest<any>(`/message/list?page=${page}&size=${size}`, { token });
    if (res.payload)
      res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapInboxMessage) };
    return res as any;
  },
  async search(
    token: string,
    q: string,
    page = 0,
    size = 50,
  ): Promise<ApiResponse<PaginatedResult<AdminInboxMessage> & { stats?: AdminInboxStats }>> {
    const res = await apiRequest<any>(
      `/message/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`,
      { token },
    );
    if (res.payload)
      res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapInboxMessage) };
    return res as any;
  },
  async updateStatus(
    token: string,
    messageId: string,
    status: string,
  ): Promise<ApiResponse<AdminInboxMessage>> {
    const res = await apiRequest<any>(
      `/message/${messageId}?status=${encodeURIComponent(status)}`,
      { method: "POST", token },
    );
    if (res.payload) res.payload = mapInboxMessage(res.payload);
    return res as any;
  },
  async reply(
    token: string,
    messageId: string,
    subject: string,
    message: string,
  ): Promise<ApiResponse<AdminInboxMessage>> {
    const res = await apiRequest<any>(`/message/reply/${messageId}`, {
      method: "POST",
      token,
      body: { subject, message },
    });
    if (res.payload) res.payload = mapInboxMessage(res.payload);
    return res as any;
  },
};
