import { rrApi, type RrPlatformSettings } from "@/lib/rr-api";

export type BrandApplicationRemoteSettings = {
  enabled: boolean;
  updatedAt?: string;
};

export function normalizeBrandApplicationSettings(
  settings?: RrPlatformSettings | null,
): BrandApplicationRemoteSettings {
  const brandApplications = settings?.brandApplications;
  return {
    enabled: brandApplications?.enabled !== false,
    updatedAt: brandApplications?.updatedAt ?? undefined,
  };
}

export async function fetchBrandApplicationSettings(): Promise<BrandApplicationRemoteSettings> {
  const response = await rrApi.getPublicPlatformSettings();
  return normalizeBrandApplicationSettings(response.payload);
}

export async function saveBrandApplicationSettingsRemote(
  token: string,
  enabled: boolean,
): Promise<BrandApplicationRemoteSettings> {
  const updatedAt = new Date().toISOString();
  const value: RrPlatformSettings = {
    brandApplications: {
      enabled,
      updatedAt,
    },
  };
  const response = await rrApi.updateConfig(token, "platform_settings", value);
  return normalizeBrandApplicationSettings(response.payload ?? value);
}
