import { API_BASE_URL, ApiError, type ApiResponse } from "@/lib/api";
import { filterFilesByUploadLimit, validateFileSize } from "@/lib/upload-limits";

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

export type UploadedMedia = {
  url: string;
  fileName: string;
};

type UploadOptions = {
  folder?: string;
  prefix?: string;
};

async function parseUploadResponse<T>(response: Response) {
  let data: ApiResponse<T> | null = null;
  try {
    data = (await response.json()) as ApiResponse<T>;
  } catch {
    data = null;
  }

  if (!response.ok || !data?.success) {
    throw new ApiError(data?.message || "Upload failed", data?.payload);
  }

  return data;
}

export async function uploadMediaFile(file: File, options: UploadOptions = {}) {
  const sizeError = validateFileSize(file);
  if (sizeError) throw new ApiError(sizeError);

  const token = readToken();
  const formData = new FormData();
  formData.append("file", file);
  if (options.folder) formData.append("folder", options.folder);
  if (options.prefix) formData.append("prefix", options.prefix);

  const response = await fetch(`${API_BASE_URL}/file/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const data = await parseUploadResponse<UploadedMedia>(response);
  if (!data.payload) throw new ApiError("Upload completed without a file URL");
  return data.payload;
}

export async function uploadMediaFiles(files: File[], options: UploadOptions = {}) {
  const { rejected } = filterFilesByUploadLimit(files);
  if (rejected.length) throw new ApiError(rejected[0]);

  const uploads = await Promise.all(files.map((file) => uploadMediaFile(file, options)));
  return uploads;
}
