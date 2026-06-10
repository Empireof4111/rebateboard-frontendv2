import { apiRequest, type ApiResponse } from "./api";

// ─── Pagination ────────────────────────────────────────────────────────────
export type PaginatedResult<T> = {
  page: T[];
  size: number;
  currentPage: number;
  totalPages: number;
};

// ─── Blog ──────────────────────────────────────────────────────────────────
export type BlogPost = {
  id: string;
  title: string;
  author: string;
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

function mapBlog(raw: any): BlogPost {
  return {
    id: String(raw.id),
    title: raw.title ?? "",
    author: raw.createdBy?.name ?? `User #${raw.createdById}`,
    views: String(raw.likes ?? 0),
    status: raw.status === "ACTIVE" ? "published" : "draft",
    time: raw.updatedAt ?? raw.createdAt ?? "",
    cover: raw.thumbnail ?? "",
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
    const res = await apiRequest<any>(`/blog/search?q=${encodeURIComponent(q)}&size=100`, { token });
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
    const res = await apiRequest<any>(`/blog/${id}`, { method: "PUT", token, body: { ...blogToDto(data), status: data.status === "published" ? "ACTIVE" : "INACTIVE" } });
    if (res.payload) res.payload = mapBlog(res.payload);
    return res as any;
  },
  async remove(token: string, id: string): Promise<ApiResponse<void>> {
    return apiRequest(`/blog/${id}`, { method: "DELETE", token });
  },
};

// ─── News ──────────────────────────────────────────────────────────────────
export type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  status: "draft" | "published";
  published: string;
  author: string;
};

function mapNews(raw: any): NewsItem {
  return {
    id: String(raw.id),
    title: raw.title ?? "",
    excerpt: raw.description ?? "",
    status: raw.status === "ACTIVE" ? "published" : "draft",
    published: raw.createdAt ?? "",
    author: raw.createdBy?.name ?? `User #${raw.createdById}`,
  };
}

export const newsApi = {
  async list(token: string, page = 0, size = 100): Promise<ApiResponse<PaginatedResult<NewsItem>>> {
    const res = await apiRequest<any>(`/news/list?page=${page}&size=${size}`, { token });
    if (res.payload) res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapNews) };
    return res as any;
  },
  async create(token: string, data: Partial<NewsItem>): Promise<ApiResponse<NewsItem>> {
    const res = await apiRequest<any>("/news/", { method: "POST", token, body: { title: data.title, description: data.excerpt, status: data.status === "published" ? "ACTIVE" : "INACTIVE" } });
    if (res.payload) res.payload = mapNews(res.payload);
    return res as any;
  },
  async update(token: string, id: string, data: Partial<NewsItem>): Promise<ApiResponse<NewsItem>> {
    const res = await apiRequest<any>(`/news/${id}`, { method: "PUT", token, body: { title: data.title, description: data.excerpt, status: data.status === "published" ? "ACTIVE" : "INACTIVE" } });
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
    const res = await apiRequest<any>("/faq/", { method: "POST", token, body: { title: data.question, description: data.answer, category: data.category } });
    if (res.payload) res.payload = mapFaq(res.payload);
    return res as any;
  },
  async update(token: string, id: string, data: Partial<Faq>): Promise<ApiResponse<Faq>> {
    const res = await apiRequest<any>(`/faq/${id}`, { method: "PUT", token, body: { title: data.question, description: data.answer, category: data.category, status: data.status === "published" ? "ACTIVE" : "INACTIVE" } });
    if (res.payload) res.payload = mapFaq(res.payload);
    return res as any;
  },
  async remove(token: string, id: string): Promise<ApiResponse<void>> {
    return apiRequest(`/faq/${id}`, { method: "DELETE", token });
  },
};

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
    ACTIVE: "active", INACTIVE: "scheduled", REVOKED: "expired", DELETED: "expired",
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
  const statusMap: Record<string, string> = { active: "ACTIVE", scheduled: "INACTIVE", expired: "REVOKED" };
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
  async list(token: string, page = 0, size = 200): Promise<ApiResponse<PaginatedResult<Announcement>>> {
    const res = await apiRequest<any>(`/announcement/list?page=${page}&size=${size}`, { token });
    if (res.payload) res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapAnnouncement) };
    return res as any;
  },
  async create(token: string, data: Partial<Announcement>): Promise<ApiResponse<Announcement>> {
    const res = await apiRequest<any>("/announcement/", { method: "POST", token, body: announcementToDto(data) });
    if (res.payload) res.payload = mapAnnouncement(res.payload);
    return res as any;
  },
  async update(token: string, id: string, data: Partial<Announcement>): Promise<ApiResponse<Announcement>> {
    const res = await apiRequest<any>(`/announcement/${id}`, { method: "PUT", token, body: announcementToDto(data) });
    if (res.payload) res.payload = mapAnnouncement(res.payload);
    return res as any;
  },
  async remove(token: string, id: string): Promise<ApiResponse<void>> {
    return apiRequest(`/announcement/${id}`, { method: "DELETE", token });
  },
};

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
  async list(token: string, page = 0, size = 50): Promise<ApiResponse<PaginatedResult<AdminUser>>> {
    const res = await apiRequest<any>(`/user/list?page=${page}&size=${size}`, { token });
    if (res.payload) res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapUser) };
    return res as any;
  },
  async search(token: string, q: string, page = 0, size = 50): Promise<ApiResponse<PaginatedResult<AdminUser>>> {
    const res = await apiRequest<any>(`/user/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`, { token });
    if (res.payload) res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapUser) };
    return res as any;
  },
  async updateStatus(token: string, userId: string, status: string): Promise<ApiResponse<AdminUser>> {
    const res = await apiRequest<any>(`/user/status-change/${userId}`, { method: "PUT", token, body: { status } });
    if (res.payload) res.payload = mapUser(res.payload);
    return res as any;
  },
  async update(token: string, userId: string, data: Partial<AdminUser>): Promise<ApiResponse<AdminUser>> {
    const res = await apiRequest<any>(`/user/${userId}`, { method: "PUT", token, body: { name: data.name, emailAddress: data.email, country: data.country } });
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
    ACTIVE: "active", INACTIVE: "unsubscribed", BLOCKED: "bounced",
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
  async list(token: string, page = 0, size = 200): Promise<ApiResponse<PaginatedResult<Subscriber>>> {
    const res = await apiRequest<any>(`/news/subscription/list?page=${page}&size=${size}`, { token });
    if (res.payload) res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapSubscriber) };
    return res as any;
  },
  async search(token: string, q: string): Promise<ApiResponse<PaginatedResult<Subscriber>>> {
    const res = await apiRequest<any>(`/news/subscription/search?q=${encodeURIComponent(q)}&size=200`, { token });
    if (res.payload) res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapSubscriber) };
    return res as any;
  },
  async add(token: string, email: string, name?: string, source?: string): Promise<ApiResponse<Subscriber>> {
    const res = await apiRequest<any>("/news/subscribe", { method: "POST", token, body: { emailAddress: email, name, source } });
    if (res.payload) res.payload = mapSubscriber(res.payload);
    return res as any;
  },
};

// ─── Adverts ───────────────────────────────────────────────────────────────
export type DashboardAd = {
  id: string;
  name: string;
  format: "marquee" | "single" | "carousel" | "trending";
  placement: "dashboard" | "landing-hero" | "landing-sponsors" | "landing-advertise";
  active: boolean;
  priority: number;
  headline: string;
  sub?: string;
  cta?: string;
  href: string;
  accent: string;
  thumbnail?: string;
  slides?: any[];
  sponsors?: any[];
  trendingLimit?: number;
  impressions: number;
  clicks: number;
  createdAt: string;
  startAt?: string;
  endAt?: string;
};

const VALID_FORMATS = new Set(["marquee", "single", "carousel", "trending"]);
const VALID_PLACEMENTS = new Set(["dashboard", "landing-hero", "landing-sponsors", "landing-advertise"]);

function mapAdvert(raw: any): DashboardAd {
  const meta = raw.metadata ?? {};
  const rawFormat = meta.format ?? "single";
  const rawPlacement = meta.placement ?? raw.page ?? "dashboard";
  return {
    id: String(raw.id),
    name: raw.title ?? "",
    format: VALID_FORMATS.has(rawFormat) ? rawFormat : "single",
    placement: VALID_PLACEMENTS.has(rawPlacement) ? rawPlacement : "dashboard",
    active: raw.active !== false,
    priority: Number(raw.priority ?? 0),
    headline: raw.title ?? "",
    sub: raw.subTitle ?? meta.sub,
    cta: raw.action ?? meta.cta,
    href: meta.href ?? "",
    accent: meta.accent ?? "from-violet-500 to-fuchsia-600",
    thumbnail: raw.thumbnail ?? "",
    slides: meta.slides,
    sponsors: meta.sponsors,
    trendingLimit: meta.trendingLimit,
    impressions: Number(raw.impressions ?? 0),
    clicks: Number(raw.clicks ?? 0),
    createdAt: raw.createdAt ?? "",
    startAt: raw.startAt,
    endAt: raw.endAt,
  };
}

function advertToDto(data: Partial<DashboardAd>) {
  return {
    title: data.name ?? data.headline,
    subTitle: data.sub,
    thumbnail: data.thumbnail ?? "",
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
      href: data.href,
      cta: data.cta,
      sub: data.sub,
      slides: data.slides,
      sponsors: data.sponsors,
      trendingLimit: data.trendingLimit,
    },
  };
}

export const advertApi = {
  async list(token: string, page = 0, size = 100): Promise<ApiResponse<PaginatedResult<DashboardAd>>> {
    const res = await apiRequest<any>(`/advert/list?page=${page}&size=${size}`, { token });
    if (res.payload) res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapAdvert) };
    return res as any;
  },
  async create(token: string, data: Partial<DashboardAd>): Promise<ApiResponse<DashboardAd>> {
    const res = await apiRequest<any>("/advert/", { method: "POST", token, body: advertToDto(data) });
    if (res.payload) res.payload = mapAdvert(res.payload);
    return res as any;
  },
  async update(token: string, id: string, data: Partial<DashboardAd>): Promise<ApiResponse<DashboardAd>> {
    const res = await apiRequest<any>(`/advert/${id}`, { method: "PUT", token, body: advertToDto(data) });
    if (res.payload) res.payload = mapAdvert(res.payload);
    return res as any;
  },
  async remove(token: string, id: string): Promise<ApiResponse<void>> {
    return apiRequest(`/advert/${id}`, { method: "DELETE", token });
  },
};

// ─── Admin Brands ───────────────────────────────────────────────────────────
export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  category: string;
  thumbnail: string;
  primaryColor: string;
  tbi: number;
  status: string;
};

function mapAdminBrand(raw: any): AdminBrand {
  return {
    id: String(raw.id),
    name: raw.name ?? "",
    slug: raw.slug ?? "",
    category: raw.category ?? "",
    thumbnail: raw.thumbnail ?? "",
    primaryColor: raw.primaryColor ?? "",
    tbi: Number(raw.tbi ?? 0),
    status: raw.status ?? "",
  };
}

export const adminBrandApi = {
  async list(token: string): Promise<ApiResponse<AdminBrand[]>> {
    const res = await apiRequest<any>("/admin-brand/list", { token });
    if (res.payload) res.payload = (Array.isArray(res.payload) ? res.payload : res.payload.page ?? []).map(mapAdminBrand);
    return res as any;
  },
};

// ─── Popups ────────────────────────────────────────────────────────────────
export type PopupItem = {
  id: string;
  title: string;
  message: string;
  cta: string;
  link: string;
  trigger: "On load" | "After 10s" | "Exit intent" | "Specific page";
  audience: "All" | "Logged in" | "Guests";
  start: string;
  end: string;
  status: "draft" | "active" | "paused";
  views: number;
  clicks: number;
  thumbnail: string;
};

function mapPopup(raw: any): PopupItem {
  const statusMap: Record<string, PopupItem["status"]> = {
    ACTIVE: "active",
    INACTIVE: "draft",
    PENDING: "paused",
  };
  return {
    id: String(raw.id),
    title: raw.title ?? "",
    message: raw.description ?? "",
    cta: raw.actionText ?? "Learn more",
    link: raw.actionURL ?? "/",
    trigger: raw.trigger ?? "On load",
    audience: raw.audience ?? "All",
    start: raw.startAt ? new Date(raw.startAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—",
    end: raw.endAt ? new Date(raw.endAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—",
    status: statusMap[raw.status] ?? "draft",
    views: Number(raw.views ?? 0),
    clicks: Number(raw.clicks ?? 0),
    thumbnail: raw.thumbnail ?? "",
  };
}

function popupToDto(data: Partial<PopupItem>) {
  const statusMap: Record<string, string> = {
    active: "ACTIVE",
    draft: "INACTIVE",
    paused: "PENDING",
  };
  return {
    title: data.title,
    description: data.message,
    actionText: data.cta,
    actionURL: data.link,
    thumbnail: data.thumbnail,
    trigger: data.trigger,
    audience: data.audience,
    startAt: data.start && data.start !== "—" ? data.start : undefined,
    endAt: data.end && data.end !== "—" ? data.end : undefined,
    status: data.status ? statusMap[data.status] : undefined,
  };
}

export const popupApi = {
  async list(token: string, page = 0, size = 100): Promise<ApiResponse<PaginatedResult<PopupItem>>> {
    const res = await apiRequest<any>(`/popup/list?page=${page}&size=${size}`, { token });
    if (res.payload) res.payload = { ...res.payload, page: (res.payload.page ?? []).map(mapPopup) };
    return res as any;
  },
  async create(token: string, data: Partial<PopupItem>): Promise<ApiResponse<PopupItem>> {
    const res = await apiRequest<any>("/popup/", { method: "POST", token, body: popupToDto(data) });
    if (res.payload) res.payload = mapPopup(res.payload);
    return res as any;
  },
  async update(token: string, id: string, data: Partial<PopupItem>): Promise<ApiResponse<PopupItem>> {
    const res = await apiRequest<any>(`/popup/${id}`, { method: "PUT", token, body: popupToDto(data) });
    if (res.payload) res.payload = mapPopup(res.payload);
    return res as any;
  },
  async remove(token: string, id: string): Promise<ApiResponse<void>> {
    return apiRequest(`/popup/${id}`, { method: "DELETE", token });
  },
  async recordView(id: string): Promise<void> {
    await apiRequest(`/popup/${id}/view`, { method: "POST" });
  },
  async recordClick(id: string): Promise<void> {
    await apiRequest(`/popup/${id}/click`, { method: "POST" });
  },
};
