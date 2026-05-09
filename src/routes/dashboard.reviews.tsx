import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Pill } from "@/components/dashboard/Primitives";
import { Star } from "lucide-react";

export const Route = createFileRoute("/dashboard/reviews")({
  component: ReviewsPage,
});

function ReviewsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" subtitle="Share your experience — your reviews shape TBI." actions={
        <button className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.45)]">Write Review</button>
      } />

      <Panel title="Your Reviews">
        <ul className="space-y-3">
          {[
            { brand: "FTMO", stars: 5, text: "Fastest payouts I've seen. Support is responsive too." },
            { brand: "IC Markets", stars: 4, text: "Excellent execution but spreads widen on news." },
          ].map((r) => (
            <li key={r.brand} className="rounded-xl bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">{r.brand}</div>
                <div className="flex">{Array.from({ length: r.stars }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />)}</div>
              </div>
              <p className="mt-1 text-xs text-white/80">{r.text}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Review Impact" action={<Pill tone="primary">Live</Pill>}>
        <p className="text-sm text-white">Your last review increased FTMO's trust score by <b className="text-success">+0.2</b>.</p>
      </Panel>
    </div>
  );
}
