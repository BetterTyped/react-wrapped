import { createRng, type Rng } from "@react-wrapped/core";

/*
 * A made-up year on Orbit, a code platform that does not exist. Everything a Wrapped says about it is worked out
 * here, once, from the raw days, so the director, the cards and the tests all read the same numbers.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/** How much of a year's contributions are commits. The rest are reviews, pull requests and issues. */
const COMMIT_SHARE = 0.82;

/** The last day of the window. Fixed, so the year is the same on every machine and on every day it is built. */
export const SAMPLE_YEAR_END = "2026-10-10";

export interface SampleDay {
  date: Date;
  count: number;
  /** 0 is nothing, 1 to 4 are quartiles of the active days. */
  level: number;
  /** 0 is Sunday, as in Date#getUTCDay. */
  weekday: number;
}

/** A run of days. `start` is the index of its first day in the year. */
export interface SampleSpan {
  start: number;
  length: number;
  from: Date;
  to: Date;
}

export interface SampleRepository {
  name: string;
  commits: number;
  language: string;
  color: string;
}

export interface SampleLanguage {
  name: string;
  color: string;
  /** Percent of what was written, whole numbers. */
  share: number;
}

/** One year as a handful of counts: this one, and the one before it for the comparison. */
export interface SampleTotals {
  contributions: number;
  commits: number;
  pullRequests: number;
  reviews: number;
  activeDays: number;
}

/** A month of the window, whole or cut into by one of its ends. */
export interface SampleMonthTotal {
  /** "Mar" */
  label: string;
  /** "March" */
  name: string;
  total: number;
  activeDays: number;
}

/** A whole calendar month, a count per day. */
export interface SampleMonth {
  /** "March" */
  name: string;
  /** How many cells are empty before the 1st in a week that starts on Monday. */
  lead: number;
  days: readonly number[];
  total: number;
}

export interface SampleYear {
  handle: string;
  from: Date;
  to: Date;
  days: readonly SampleDay[];
  /** Weekday of the first day, so the calendar's first column starts in the right row. */
  lead: number;
  /** Every month the window touches, in order. A window that starts mid-month has thirteen. */
  months: readonly SampleMonthTotal[];
  totals: SampleTotals;
  /** The twelve months before this window. */
  previous: SampleTotals;
  busiest: SampleDay;
  streak: SampleSpan;
  /** The longest run of empty days between two active ones. */
  quiet: SampleSpan;
  /** Totals per weekday, Sunday first. */
  weekdays: readonly number[];
  /** 0 to 1. */
  weekendShare: number;
  activeFridays: number;
  /** The whole calendar month with the most in it. Null when the year is empty. */
  bestMonth: SampleMonth | null;
  /** The whole calendar month without one empty day that had the most in it. Null when no month was full. */
  fullMonth: SampleMonth | null;
  /** Busiest first. */
  repositories: readonly SampleRepository[];
  /** Biggest first. */
  languages: readonly SampleLanguage[];
  /** When the commits were written: seven rows, Monday first, of 24 hours. */
  hours: readonly (readonly number[])[];
}

/** What a year is derived from. Hand `yearFromCounts` your own to see how the director handles it. */
export interface SampleYearInput {
  handle: string;
  /** The last day of the window, as "2026-10-10". */
  end: string;
  /** One count per day, oldest first. At least one day. */
  counts: readonly number[];
  pullRequests: number;
  reviews: number;
  previous: SampleTotals;
  repositories: readonly SampleRepository[];
  /** Any weights: they are turned into percent here. */
  languages: readonly { name: string; color: string; weight: number }[];
  hours: readonly (readonly number[])[];
}

const monthName = (date: Date) => date.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });

/** The usual bucketing of a contribution graph: 0 is no activity, 1 to 4 are quartiles of the active days. */
function levelsOf(counts: readonly number[]): number[] {
  const active = counts.filter((count) => count > 0).toSorted((a, b) => a - b);
  const quartile = (fraction: number) => active[Math.floor((active.length - 1) * fraction)] ?? 1;
  const [q1, q2, q3] = [quartile(0.25), quartile(0.5), quartile(0.75)];
  return counts.map((count) => (count === 0 ? 0 : count <= q1 ? 1 : count <= q2 ? 2 : count <= q3 ? 3 : 4));
}

/** Every run of days in a row that pass the test. */
function runs(days: readonly SampleDay[], test: (day: SampleDay) => boolean): { start: number; length: number }[] {
  const found: { start: number; length: number }[] = [];
  days.forEach((day, index) => {
    if (!test(day)) return;
    const last = found.at(-1);
    if (last && last.start + last.length === index) last.length += 1;
    else found.push({ start: index, length: 1 });
  });
  return found;
}

function longestSpan(days: readonly SampleDay[], found: readonly { start: number; length: number }[]): SampleSpan {
  const run = found.reduce<{ start: number; length: number } | null>(
    (best, item) => (!best || item.length > best.length ? item : best),
    null,
  );
  if (!run) return { start: 0, length: 0, from: days[0].date, to: days[0].date };
  return { ...run, from: days[run.start].date, to: days[run.start + run.length - 1].date };
}

/** The whole calendar months of the window. A month the window cuts into is never whole. */
function wholeMonths(days: readonly SampleDay[]): SampleMonth[] {
  const byMonth = new Map<string, SampleDay[]>();
  for (const day of days) {
    const key = day.date.toISOString().slice(0, 7);
    byMonth.set(key, [...(byMonth.get(key) ?? []), day]);
  }
  return [...byMonth.values()].flatMap((month) => {
    const first = month[0].date;
    const length = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    if (month.length !== length) return [];
    return [
      {
        name: monthName(first),
        lead: (first.getUTCDay() + 6) % 7,
        days: month.map((day) => day.count),
        total: month.reduce((sum, day) => sum + day.count, 0),
      },
    ];
  });
}

const biggest = (months: readonly SampleMonth[]) =>
  months.reduce<SampleMonth | null>(
    (best, month) => (month.total > 0 && (!best || month.total > best.total) ? month : best),
    null,
  );

/** Everything a Wrapped can say about a year, worked out from its raw days. Pure: the same input, the same year. */
export function yearFromCounts(input: SampleYearInput): SampleYear {
  const to = new Date(`${input.end}T00:00:00Z`);
  const from = new Date(to.getTime() - (input.counts.length - 1) * DAY_MS);
  const levels = levelsOf(input.counts);
  const days: SampleDay[] = input.counts.map((count, index) => {
    const date = new Date(from.getTime() + index * DAY_MS);
    return { date, count, level: levels[index], weekday: date.getUTCDay() };
  });

  const weekdays = [0, 0, 0, 0, 0, 0, 0];
  for (const day of days) weekdays[day.weekday] += day.count;

  const months: SampleMonthTotal[] = [];
  for (const day of days) {
    const label = day.date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
    let month = months.at(-1);
    if (!month || month.label !== label) {
      month = { label, name: monthName(day.date), total: 0, activeDays: 0 };
      months.push(month);
    }
    month.total += day.count;
    month.activeDays += day.count > 0 ? 1 : 0;
  }

  const contributions = days.reduce((sum, day) => sum + day.count, 0);
  const whole = wholeMonths(days);
  const weight = input.languages.reduce((sum, language) => sum + language.weight, 0);

  return {
    handle: input.handle,
    from,
    to,
    days,
    lead: days[0]?.weekday ?? 0,
    months,
    totals: {
      contributions,
      commits: Math.round(contributions * COMMIT_SHARE),
      pullRequests: input.pullRequests,
      reviews: input.reviews,
      activeDays: days.filter((day) => day.count > 0).length,
    },
    previous: input.previous,
    busiest: days.reduce((best, day) => (day.count > best.count ? day : best), days[0]),
    streak: longestSpan(
      days,
      runs(days, (day) => day.count > 0),
    ),
    // A break sits between active days: quiet at the very start or end of the window is not one.
    quiet: longestSpan(
      days,
      runs(days, (day) => day.count === 0).filter((run) => run.start > 0 && run.start + run.length < days.length),
    ),
    weekdays,
    weekendShare: contributions > 0 ? (weekdays[0] + weekdays[6]) / contributions : 0,
    activeFridays: days.filter((day) => day.weekday === 5 && day.count > 0).length,
    bestMonth: biggest(whole),
    fullMonth: biggest(whole.filter((month) => month.days.every((count) => count > 0))),
    repositories: input.repositories.toSorted((a, b) => b.commits - a.commits),
    languages: input.languages
      .toSorted((a, b) => b.weight - a.weight)
      .map(({ name, color, weight: own }) => ({
        name,
        color,
        share: weight > 0 ? Math.round((own / weight) * 100) : 0,
      })),
    hours: input.hours,
  };
}

const LANGUAGES = [
  { name: "TypeScript", color: "#3178c6" },
  { name: "Rust", color: "#dea584" },
  { name: "Go", color: "#00add8" },
  { name: "Python", color: "#3572a5" },
  { name: "CSS", color: "#663399" },
  { name: "Shell", color: "#89e051" },
] as const;

/** Orbit's own projects and the handle's side projects. The first two are always in: a team one and a personal one. */
const repositoryNames = (handle: string) => ({
  fixed: ["orbit/landing", `${handle}/dotfiles`],
  pool: ["orbit/flight-deck", `${handle}/star-chart`, "orbit/docs", `${handle}/tiny-router`, "orbit/launchpad"],
});

/** A seeded shuffle. Not a sort with a random comparator: that depends on the engine's sort, and this must not. */
function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = rng.int(index + 1);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

/** How the commits split between the busiest repositories. The rest of the year went to smaller ones. */
const REPOSITORY_SHARES = [0.44, 0.21, 0.12, 0.07];
const LANGUAGE_WEIGHTS = [54, 24, 14, 8];

/**
 * A believable year for a made-up developer, seeded by the handle: the same name always gets the same year. Busy
 * weekdays and thin weekends, a quiet stretch in the first half, one long streak in the second, and one day that
 * towers over the rest.
 */
export function sampleYear(handle = "ada", end = SAMPLE_YEAR_END): SampleYear {
  const rng = createRng(`orbit-sample:${handle.toLowerCase()}`);
  const from = new Date(new Date(`${end}T00:00:00Z`).getTime() - 364 * DAY_MS);
  const weekdayOf = (index: number) => new Date(from.getTime() + index * DAY_MS).getUTCDay();

  // The quiet stretch sits in the first half and the streak in the second, so they never run into each other.
  const quietAt = 70 + rng.int(60);
  const quietLength = 9 + rng.int(6);
  const streakAt = 205 + rng.int(60);
  const streakLength = 36 + rng.int(18);
  // The biggest day is a working day well clear of both, so it stands on its own.
  let launchAt = 150 + rng.int(40);
  while (weekdayOf(launchAt) === 0 || weekdayOf(launchAt) === 6) launchAt += 1;
  const launchCount = 52 + rng.int(18);

  const counts = Array.from({ length: 365 }, (_unused, index) => {
    const weekday = weekdayOf(index);
    const weekend = weekday === 0 || weekday === 6;
    // Drawn for every day, quiet or not, so moving the quiet stretch does not reshuffle the rest of the year.
    const shows = rng.next() < (weekend ? 0.2 : 0.84);
    const size = -Math.log(1 - rng.next());
    if (index === launchAt) return launchCount;
    if (index >= quietAt && index < quietAt + quietLength) return 0;
    const inStreak = index >= streakAt && index < streakAt + streakLength;
    // The days on either side of the quiet stretch are active: a break sits between two days of work.
    const edge = index === quietAt - 1 || index === quietAt + quietLength;
    if (!inStreak && !edge && !shows) return 0;
    const season = 0.85 + 0.35 * Math.sin((index / 365) * Math.PI * 2);
    // Fridays run a little hot, weekends a little cold.
    const mood = weekend ? 0.45 : weekday === 5 ? 1.15 : 1;
    return Math.min(38, Math.max(1, Math.round(size * 8.5 * season * mood)));
  });

  const contributions = counts.reduce((sum, count) => sum + count, 0);
  const commits = Math.round(contributions * COMMIT_SHARE);
  const languages = [LANGUAGES[0], ...shuffled(LANGUAGES.slice(1), rng)].slice(0, 4);
  const names = repositoryNames(handle);
  const repositories = [...names.fixed, ...shuffled(names.pool, rng).slice(0, 2)];

  // An office day with a bump before lunch and one after, and a second, smaller shift late in the evening.
  const hours = Array.from({ length: 7 }, (_row, day) =>
    Array.from({ length: 24 }, (_cell, hour) => {
      const weekend = day > 4;
      const office = (Math.exp(-((hour - 10.5) ** 2) / 5) + Math.exp(-((hour - 15) ** 2) / 7)) * (day === 4 ? 1.25 : 1);
      const evening = Math.exp(-((hour - 22) ** 2) / 4) * 0.5;
      return Math.max(
        0,
        Math.round((weekend ? office * 0.12 + evening * 0.8 : office + evening) * 11 + rng.next() - 0.6),
      );
    }),
  );

  return yearFromCounts({
    handle,
    end,
    counts,
    pullRequests: 64 + rng.int(40),
    reviews: 70 + rng.int(60),
    previous: {
      contributions: Math.round(contributions * 0.58),
      commits: Math.round(commits * 0.55),
      pullRequests: 30 + rng.int(20),
      reviews: 20 + rng.int(30),
      activeDays: 150 + rng.int(40),
    },
    repositories: repositories.map((name, index) => ({
      name,
      commits: Math.round(commits * REPOSITORY_SHARES[index]),
      language: languages[index % languages.length].name,
      color: languages[index % languages.length].color,
    })),
    languages: languages.map(({ name, color }, index) => ({ name, color, weight: LANGUAGE_WEIGHTS[index] })),
    hours,
  });
}

/** The year as weekly totals, in weeks that start on a Sunday, the way the calendar draws them. */
export function weeklyTotals(year: SampleYear): number[] {
  const weeks: number[] = [];
  year.days.forEach((day, index) => {
    const week = Math.floor((index + year.lead) / 7);
    weeks[week] = (weeks[week] ?? 0) + day.count;
  });
  return Array.from(weeks, (value) => value ?? 0);
}

/** The hours that count as night: 10 pm to 5 am. */
export const LATE_HOURS: readonly number[] = [22, 23, 0, 1, 2, 3, 4];

/** The week by the hour folded into one day: 24 totals, midnight first. */
export const hoursOfDay = (year: SampleYear): number[] =>
  Array.from({ length: 24 }, (_unused, hour) => year.hours.reduce((sum, row) => sum + (row[hour] ?? 0), 0));

/** How much of the year's commits were written at night, 0 to 1. */
export function nightShare(year: SampleYear): number {
  const day = hoursOfDay(year);
  const all = day.reduce((sum, count) => sum + count, 0);
  return all > 0 ? LATE_HOURS.reduce((sum, hour) => sum + day[hour], 0) / all : 0;
}

/** Languages that got real use: a tenth of what was written, or more. */
export const languagesInUse = (year: SampleYear) => year.languages.filter((language) => language.share >= 10).length;

/** What every card and the video call this Wrapped. */
export const SAMPLE_CAPTION = "Orbit Wrapped";

/** The window the numbers cover: "Oct 2025 to Oct 2026". */
export const samplePeriod = (year: SampleYear) => `${formatMonthYear(year.from)} to ${formatMonthYear(year.to)}`;

/** "Mar 14" */
export const formatShort = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
/** "Oct 2025" */
export const formatMonthYear = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
/** "Tuesday, March 14" */
export const formatDay = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
