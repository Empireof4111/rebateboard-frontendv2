import { createFileRoute } from "@tanstack/react-router";
import { AcademyShell } from "@/components/academy/AcademyShell";

export const Route = createFileRoute("/dashboard/academy")({
  component: AcademyPage,
});

function AcademyPage() {
  return (
    <div className="space-y-6">
      <AcademyShell preview={false} />
    </div>
  );
}
