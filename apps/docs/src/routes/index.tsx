import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "react-wrapped: a year in review as a video, in React" }] }),
  component: Home,
});

function Home() {
  return (
    <main>
      <h1>react-wrapped</h1>
      <p>A year in review, played as a video, in React.</p>
      <Link to="/charts/">Charts</Link>
    </main>
  );
}
