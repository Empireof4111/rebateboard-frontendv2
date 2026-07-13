export const MAX_UPLOAD_BYTES =
  Number(import.meta.env.VITE_MAX_UPLOAD_BYTES || import.meta.env.VITE_MAX_FILE_SIZE) ||
  10 * 1024 * 1024;

export const MAX_UPLOAD_MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

export function formatUploadLimit(bytes = MAX_UPLOAD_BYTES) {
  const mb = bytes / (1024 * 1024);
  return `${Number.isInteger(mb) ? mb.toFixed(0) : mb.toFixed(1)} MB`;
}

export function validateFileSize(file: File, maxBytes = MAX_UPLOAD_BYTES) {
  if (file.size <= maxBytes) return null;
  return `${file.name} is larger than ${formatUploadLimit(maxBytes)}.`;
}

export function filterFilesByUploadLimit(files: File[], maxBytes = MAX_UPLOAD_BYTES) {
  const accepted: File[] = [];
  const rejected: string[] = [];

  for (const file of files) {
    const error = validateFileSize(file, maxBytes);
    if (error) rejected.push(error);
    else accepted.push(file);
  }

  return { accepted, rejected };
}
