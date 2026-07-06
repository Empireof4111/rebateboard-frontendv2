import { apiRequest, type ApiResponse } from "@/lib/api";

export type VerificationStatus = "not_started" | "pending" | "verified" | "rejected";

export type VerificationRecord = {
  id: number;
  userId: number;
  name: string;
  identityType: string;
  identityNumber: string;
  identity: string;
  face: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type VerificationSubmission = {
  name: string;
  identityType: string;
  identityNumber: string;
  identity: string;
  face: string;
};

export function normalizeVerificationStatus(value?: string | null): VerificationStatus {
  const status = (value ?? "").toUpperCase();
  if (status === "APPROVED") return "verified";
  if (status === "DECLINED" || status === "REJECTED") return "rejected";
  if (status === "PENDING") return "pending";
  return "not_started";
}

export const verificationApi = {
  getCurrent(token: string): Promise<ApiResponse<VerificationRecord>> {
    return apiRequest<VerificationRecord>("/verification/", { token });
  },

  submit(
    token: string,
    body: VerificationSubmission,
  ): Promise<ApiResponse<VerificationRecord>> {
    return apiRequest<VerificationRecord>("/verification/", {
      method: "POST",
      token,
      body,
    });
  },
};
