import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/superadmin/rewards")({
  beforeLoad: () => {
    throw redirect({ to: "/superadmin/rr" });
  },
  component: () => null,
});
