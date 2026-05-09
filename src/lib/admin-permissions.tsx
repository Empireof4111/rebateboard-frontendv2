// Admin permissions runtime — single source of truth for "what can the current sub-admin do?"
// Backed by the same admin-store the Roles & Permissions page edits, so changes there are live.
import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react";
import { useAdminCollection } from "@/lib/admin-store";
import { roles as seedRoles, allPermissions, routePermissionMap, type Role } from "@/lib/admin-data";

type Ctx = {
  roles: Role[];
  activeRoleId: string;
  setActiveRoleId: (id: string) => void;
  activeRole: Role | undefined;
  permissions: Set<string>;
  can: (perm: string) => boolean;
  canRoute: (route: string) => boolean;
};

const AdminPermsContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "rb_admin_active_role";

export function AdminPermissionsProvider({ children }: { children: ReactNode }) {
  const { items: roles } = useAdminCollection<Role>("roles", seedRoles);
  const [activeRoleId, setActiveRoleIdState] = useState<string>(() => {
    if (typeof window === "undefined") return "ro_1";
    return localStorage.getItem(STORAGE_KEY) || "ro_1";
  });

  const setActiveRoleId = useCallback((id: string) => {
    setActiveRoleIdState(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const value = useMemo<Ctx>(() => {
    const activeRole = roles.find((r) => r.id === activeRoleId) ?? roles[0];
    const permissions = new Set<string>(activeRole?.permissions ?? []);
    return {
      roles,
      activeRoleId: activeRole?.id ?? "ro_1",
      setActiveRoleId,
      activeRole,
      permissions,
      can: (perm: string) => permissions.has(perm),
      canRoute: (route: string) => {
        const required = routePermissionMap[route];
        if (!required) return true; // routes with no mapped permission are public to admins
        return permissions.has(required);
      },
    };
  }, [roles, activeRoleId, setActiveRoleId]);

  return <AdminPermsContext.Provider value={value}>{children}</AdminPermsContext.Provider>;
}

export function useAdminPermissions() {
  const ctx = useContext(AdminPermsContext);
  if (!ctx) throw new Error("useAdminPermissions must be used within AdminPermissionsProvider");
  return ctx;
}

export { allPermissions };
