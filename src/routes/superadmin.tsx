import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SuperadminLayout } from "@/components/superadmin/SuperadminLayout";
import { AdminPermissionsProvider } from "@/lib/admin-permissions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/superadmin")({
  head: () => ({
    meta: [
      { title: "Superadmin - RebateBoard" },
      { name: "description", content: "Internal control room for RebateBoard." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SuperadminGate,
});

function SuperadminGate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate({
        to: "/login",
        search: { redirect: "/superadmin" },
      });
      return;
    }

    if (user.role !== "ADMIN") {
      navigate({ to: "/dashboard" });
    }
  }, [loading, navigate, user]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <div className="text-lg font-semibold text-white">Superadmin access required</div>
          <div className="mt-2 text-sm text-muted-foreground">
            This area is reserved for administrator accounts.
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminPermissionsProvider>
      <SuperadminLayout />
    </AdminPermissionsProvider>
  );
}
