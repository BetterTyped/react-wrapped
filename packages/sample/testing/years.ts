import { type SampleYear, type SampleYearInput, yearFromCounts } from "../src/year";

const NO_HOURS = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
const NOTHING_BEFORE = { contributions: 0, commits: 0, pullRequests: 0, reviews: 0, activeDays: 0 };

const EMPTY: SampleYearInput = {
  handle: "ada",
  end: "2026-10-10",
  counts: Array.from({ length: 365 }, () => 0),
  pullRequests: 0,
  reviews: 0,
  previous: NOTHING_BEFORE,
  repositories: [],
  languages: [],
  hours: NO_HOURS,
};

/** A year with three contributions in it, months apart, and nothing else known about it. */
export function thinYear(): SampleYear {
  const counts = [...EMPTY.counts];
  counts[100] = 2;
  counts[180] = 1;
  counts[300] = 1;
  return yearFromCounts({ ...EMPTY, counts });
}

/**
 * A year that earns every achievement in the catalog: something on almost every day, one week off, one huge day,
 * late nights, a lot of reviews, one repository that took half the commits, and a much thinner year before it.
 */
export function fullYear(): SampleYear {
  const counts: number[] = Array.from({ length: 365 }, (_unused, index) => (index >= 40 && index < 48 ? 0 : 4));
  counts[200] = 60;
  const commits = Math.round(counts.reduce((sum, count) => sum + count, 0) * 0.82);
  return yearFromCounts({
    ...EMPTY,
    counts,
    pullRequests: 90,
    reviews: 80,
    previous: { contributions: 500, commits: 400, pullRequests: 20, reviews: 10, activeDays: 120 },
    repositories: [
      { name: "orbit/landing", commits: Math.round(commits * 0.5), language: "TypeScript", color: "#3178c6" },
      { name: "ada/dotfiles", commits: Math.round(commits * 0.2), language: "Shell", color: "#89e051" },
    ],
    languages: [
      { name: "TypeScript", color: "#3178c6", weight: 40 },
      { name: "Rust", color: "#dea584", weight: 30 },
      { name: "Shell", color: "#89e051", weight: 30 },
    ],
    // Every evening from ten to midnight, and one hour after lunch.
    hours: Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, (_cell, hour) => (hour >= 22 ? 6 : hour === 14 ? 8 : 0)),
    ),
  });
}
