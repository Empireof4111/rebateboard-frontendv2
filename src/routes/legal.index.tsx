import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/")({
  component: () => <Navigate to="/legal/$slug" params={{ slug: "terms" }} replace />,
});
