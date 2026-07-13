import { createFileRoute } from "@tanstack/react-router";
import { BlogExperience } from "@/routes/blog";

export const Route = createFileRoute("/dashboard/blog-news")({
  head: () => ({
    meta: [
      { title: "Blog & News — RebateBoard Dashboard" },
      {
        name: "description",
        content: "RebateBoard articles, guides, and market updates inside your trading dashboard.",
      },
    ],
  }),
  component: () => <BlogExperience embedded />,
});
