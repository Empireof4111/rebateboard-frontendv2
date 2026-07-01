import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/rebeta")({
  component: () => <Navigate to="/dashboard/ai-coach" replace />,
});
