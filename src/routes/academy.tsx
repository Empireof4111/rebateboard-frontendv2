import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AcademyShell } from "@/components/academy/AcademyShell";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "Trading Academy — Faculties, Courses & Certificates · RebateBoard" },
      { name: "description", content: "A trader university with faculties for Prop Firms, Forex, Crypto, and Risk & Psychology. Free and paid courses, quizzes, certificates, and RR rewards." },
      { property: "og:title", content: "RebateBoard Trading Academy" },
      { property: "og:description", content: "Faculties, programs and certified trading courses. Earn RR by learning." },
    ],
  }),
  component: PublicAcademy,
});

function PublicAcademy() {
  return (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-white">
      <SiteHeader />
      <main className="container-app py-6 sm:py-8">
        <AcademyShell preview loginHref="/login" />
      </main>
    <SiteFooter />
    </div>
  );
}
