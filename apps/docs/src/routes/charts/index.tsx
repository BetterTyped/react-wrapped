import { createFileRoute, Link } from "@tanstack/react-router";

import { createRng } from "@react-wrapped/core";

export const Route = createFileRoute("/charts/")({
  head: () => ({ meta: [{ title: "Charts - react-wrapped" }] }),
  component: Charts,
});

function Charts() {
  // Something from the library, rendered on the server: the same seed gives the same number every build.
  const lucky = createRng("docs").int(100);
  return (
    <main>
      <h1>Charts</h1>
      <p>Twenty-one charts, each a picture of its own numbers. Seeded number: {lucky}.</p>
      <Link to="/">Home</Link>
    </main>
  );
}
