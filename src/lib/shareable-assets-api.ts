import { apiRequest } from "@/lib/api";

export type ShareableAssetStatus = "verified" | "revoked" | "expired" | "invalid";

export type ShareableAssetRecord = {
  publicAssetId: string;
  assetType: string;
  preset: string;
  format: string;
  theme: string;
  verifiedMetrics: Record<string, number | string | null>;
  visibleFields: string[];
  status: ShareableAssetStatus;
  issuedAt?: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
  version?: number;
  integrityValid?: boolean;
  metadata?: Record<string, unknown>;
};

export type CreateTrtShareableAssetInput = {
  preset: string;
  format: string;
  theme: string;
  verifiedMetrics: Record<string, number | string | null>;
  visibleFields: string[];
  metadata?: Record<string, unknown>;
};

export async function createTrtShareableAsset(
  token: string,
  input: CreateTrtShareableAssetInput,
) {
  const response = await apiRequest<ShareableAssetRecord>("/shareable-assets/trt", {
    method: "POST",
    token,
    body: input,
  });
  if (!response.payload) throw new Error("Missing verification record");
  return response.payload;
}

export async function verifyShareableAsset(publicAssetId: string) {
  const response = await apiRequest<ShareableAssetRecord>(
    `/shareable-assets/verify/${encodeURIComponent(publicAssetId)}`,
    { method: "GET", cache: "no-store" },
  );
  if (!response.payload) throw new Error("Missing verification record");
  return response.payload;
}
