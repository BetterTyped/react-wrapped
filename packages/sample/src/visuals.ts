import type { SampleTrait } from "./traits";
import {
  formatMonthYear,
  formatShort,
  hoursOfDay,
  languagesInUse,
  LATE_HOURS,
  nightShare,
  type SampleMonth,
  type SampleYear,
  weeklyTotals,
} from "./year";
import type { InsightCardSpec, SceneChart } from "@react-wrapped/core";

/*
 * The pictures. Every achievement tells its story with a chart of its own numbers: a streak lights up a stretch of
 * the year, a big day towers over its neighbors, a quiet stretch is a gap in a row of ticks. Each comes with the one
 * line that says what the picture shows, and the number it is about. The scene and the card to keep both draw from
 * here, so they always agree.
 */

/** A chart, the line that explains it, and the headline number, read as one sentence: "55" "days in a row". */
export interface SampleVisual {
  chart: SceneChart;
  description: string;
  stat: InsightCardSpec["stat"];
}

const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
/** Monday first, the way people read a week, as indexes into a Sunday-first list. */
const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];
const FRIDAY = 5;

const fmt = (count: number) => count.toLocaleString("en-US");
const pct = (share: number) => `${Math.round(share * 100)}%`;
const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/** The week of the calendar a day falls in, in weeks that start on a Sunday. */
const weekOf = (year: SampleYear, day: number) => Math.floor((day + year.lead) / 7);
/** A repository as it is said in a chart: without its owner. */
const shortName = (name: string) => name.split("/").at(-1) ?? name;

export const monthChart = (month: SampleMonth): SceneChart => ({ type: "month", lead: month.lead, days: month.days });

/** The year as one line of weekly totals with a stretch of days lit. A band always spans two weeks or more. */
export function sparkOver(year: SampleYear, span: { start: number; length: number }, label: string): SceneChart {
  const from = weekOf(year, span.start);
  return {
    type: "spark",
    values: weeklyTotals(year),
    band: { from, to: Math.max(from + 1, weekOf(year, span.start + span.length - 1)), label },
  };
}

/** Two weeks of days with the biggest one in the middle. */
export function peakBars(year: SampleYear): SceneChart {
  const centre = Math.max(0, year.days.indexOf(year.busiest));
  const from = Math.max(0, Math.min(year.days.length - 15, centre - 7));
  return {
    type: "bars",
    bars: year.days.slice(from, from + 15).map((day, index) => ({ value: day.count, peak: from + index === centre })),
    peakLabel: fmt(year.busiest.count),
  };
}

/** The running total, week by week, and the week it crossed `line` in. Null when it never did. */
export function runningTotal(year: SampleYear, line: number): { totals: number[]; crossed: number | null } {
  let running = 0;
  const totals = weeklyTotals(year).map((week) => {
    running += week;
    return running;
  });
  const crossed = totals.findIndex((total) => total >= line);
  return { totals, crossed: crossed === -1 ? null : crossed };
}

/** This year against the one before, a row per count. */
export function thenAndNow(year: SampleYear): SceneChart {
  const rows = [
    { label: "Contributions", was: year.previous.contributions, now: year.totals.contributions },
    { label: "Commits", was: year.previous.commits, now: year.totals.commits },
    { label: "Active days", was: year.previous.activeDays, now: year.totals.activeDays },
    { label: "Reviews", was: year.previous.reviews, now: year.totals.reviews },
  ];
  // The row to light is the biggest jump among counts big enough to mean one: 2 to 9 is not "up 350%".
  const point = rows.reduce(
    (best, row, index) =>
      row.was >= 10 && row.now / row.was > rows[best].now / Math.max(1, rows[best].was) ? index : best,
    0,
  );
  return { type: "dumbbell", rows, point };
}

/** Where the commits went, in percent of all of them: the busiest repositories, then everything else. */
export function repositoryShares(year: SampleYear): { name: string; share: number }[] {
  const all = Math.max(1, year.totals.commits);
  const shown = year.repositories
    .slice(0, 4)
    .map((repository) => ({ name: shortName(repository.name), share: (repository.commits / all) * 100 }))
    .filter((repository) => repository.share >= 1);
  const rest = 100 - sum(shown.map((repository) => repository.share));
  return shown.length > 0 && rest >= 1 ? [...shown, { name: "everything else", share: rest }] : shown;
}

/** Six ways to measure a year, each against a mark that is hard to reach. */
const SHAPE_AXES: readonly {
  label: string;
  /** How the axis is said in a headline: "Strongest on streaks." */
  word: string;
  mark: number;
  value: (year: SampleYear) => number;
  note: (year: SampleYear) => string;
  stat: (year: SampleYear) => InsightCardSpec["stat"];
}[] = [
  {
    label: "Streak",
    word: "streaks",
    mark: 60,
    value: (year) => year.streak.length,
    note: (year) => `${fmt(year.streak.length)} days in a row`,
    stat: (year) => ({ value: fmt(year.streak.length), label: "days in a row, where your year reaches furthest" }),
  },
  {
    label: "Volume",
    word: "volume",
    mark: 3000,
    value: (year) => year.totals.contributions,
    note: (year) => `${fmt(year.totals.contributions)} contributions`,
    stat: (year) => ({
      value: fmt(year.totals.contributions),
      label: "contributions, where your year reaches furthest",
    }),
  },
  {
    label: "Reviews",
    word: "reviews",
    mark: 150,
    value: (year) => year.totals.reviews,
    note: (year) => `${fmt(year.totals.reviews)} reviews`,
    stat: (year) => ({ value: fmt(year.totals.reviews), label: "reviews given, where your year reaches furthest" }),
  },
  {
    label: "Languages",
    word: "range",
    mark: 5,
    value: languagesInUse,
    note: (year) => `${languagesInUse(year)} languages`,
    stat: (year) => ({
      value: String(languagesInUse(year)),
      label: "languages in real use, where your year reaches furthest",
    }),
  },
  {
    label: "Weekends",
    word: "weekends",
    mark: 0.3,
    value: (year) => year.weekendShare,
    note: (year) => `${pct(year.weekendShare)} on weekends`,
    stat: (year) => ({ value: pct(year.weekendShare), label: "of your work on weekends, your furthest reach" }),
  },
  {
    label: "Pull requests",
    word: "pull requests",
    mark: 120,
    value: (year) => year.totals.pullRequests,
    note: (year) => `${fmt(year.totals.pullRequests)} pull requests`,
    stat: (year) => ({
      value: fmt(year.totals.pullRequests),
      label: "pull requests opened, where your year reaches furthest",
    }),
  },
];

/** The year as one outline, and the axis it reaches furthest on. */
export function yearShape(year: SampleYear) {
  const reach = SHAPE_AXES.map((axis) => Math.min(1, axis.value(year) / axis.mark));
  const strongest = SHAPE_AXES[reach.indexOf(Math.max(...reach))];
  const chart: SceneChart = {
    type: "radar",
    axes: SHAPE_AXES.map((axis, index) => ({ label: axis.label, value: reach[index] })),
    note: strongest.note(year),
  };
  return { chart, word: strongest.word, stat: strongest.stat(year) };
}

/**
 * The picture an achievement draws for this year, or null when it has none or the year is too thin for it. An
 * achievement without a picture is still earned and still sits in the trophy case. It just gets no scene.
 */
export function dropVisual(trait: SampleTrait, year: SampleYear): SampleVisual | null {
  const { totals } = year;
  switch (trait.id) {
    case "all-weather":
      // Twelve months around a ring, each as bright as the number of its days that had something on them.
      return {
        chart: {
          type: "wheel",
          segments: year.months.slice(-12).map((month) => ({ label: month.label, value: month.activeDays })),
        },
        description: "Your year, month by month. The brighter the month, the more of its days you showed up on.",
        stat: { value: fmt(totals.activeDays), label: "days with something shipped, out of 365" },
      };
    case "long-haul":
      if (year.streak.length < 3) return null;
      return {
        chart: sparkOver(year, year.streak, `${year.streak.length} days in a row`),
        description: "Contributions per week. The lit stretch is your streak: not one day missed.",
        stat: { value: fmt(year.streak.length), label: "days in a row without missing one" },
      };
    case "second-wind": {
      if (year.previous.contributions <= 0) return null;
      const growth = totals.contributions / year.previous.contributions - 1;
      return {
        chart: thenAndNow(year),
        description: "This year against last. The ring is where last year ended, the dot is where this one did.",
        stat: { value: `+${pct(growth)}`, label: "more contributions than the year before" },
      };
    }
    case "clean-sheet": {
      const month = year.fullMonth;
      if (!month) return null;
      return {
        chart: monthChart(month),
        description: `${month.name}, every day of it. Not one of them empty.`,
        stat: { value: fmt(month.total), label: `contributions in ${month.name}, without an empty day` },
      };
    }
    case "launch-day": {
      if (year.busiest.count <= 0) return null;
      const normal = (totals.contributions / Math.max(1, totals.activeDays)).toFixed(1);
      return {
        chart: peakBars(year),
        description: `Two weeks around your biggest day. A normal active day for you is about ${normal}.`,
        stat: {
          value: fmt(year.busiest.count),
          label: `contributions on ${formatShort(year.busiest.date)} alone`,
        },
      };
    }
    case "four-digits": {
      const { totals: climb, crossed } = runningTotal(year, 1000);
      if (crossed === null) return null;
      return {
        chart: { type: "pixels", values: climb, mark: { index: crossed, label: "1,000" } },
        description: "Your running total, week by week. The lit cell is the week it crossed a thousand.",
        stat: { value: fmt(totals.contributions), label: "contributions in twelve months" },
      };
    }
    case "friday-shipper": {
      const fridays = year.days.filter((day) => day.weekday === FRIDAY);
      const first = fridays[0];
      const last = fridays.at(-1);
      if (!first || !last || year.activeFridays === 0) return null;
      return {
        chart: {
          type: "meter",
          pills: fridays.map((day) => day.count),
          // With the year: the window is twelve months, so both ends are the same month.
          from: formatMonthYear(first.date),
          to: formatMonthYear(last.date),
          note: `${year.activeFridays} of ${fridays.length} Fridays`,
        },
        description: "Every Friday of your year. The lit ones are the Fridays you shipped anyway.",
        stat: {
          value: pct(year.weekdays[FRIDAY] / Math.max(1, totals.contributions)),
          label: "of your work landed on a Friday",
        },
      };
    }
    case "home-base": {
      const parts = repositoryShares(year);
      const [top] = parts;
      if (!top || parts.length < 2) return null;
      return {
        chart: { type: "bubbles", parts },
        description:
          "Every repository you committed to, sized by its share of your commits. One took most of the year.",
        stat: { value: `${Math.round(top.share)}%`, label: `of your commits went into ${top.name}` },
      };
    }
    case "night-watch": {
      const day = hoursOfDay(year);
      if (sum(day) === 0) return null;
      return {
        chart: {
          type: "clock",
          hours: day,
          mark: LATE_HOURS.reduce((best, hour) => (day[hour] > day[best] ? hour : best)),
        },
        description: "Your day, hour by hour. The lit hour is your busiest after dark.",
        stat: { value: pct(nightShare(year)), label: "of your commits were written after 10 pm" },
      };
    }
    case "second-pair":
      if (totals.reviews <= 0) return null;
      return {
        chart: {
          type: "funnel",
          steps: [
            { label: "Contributions", value: totals.contributions },
            { label: "Commits", value: totals.commits },
            { label: "Reviews", value: totals.reviews },
          ],
        },
        description: "Your year narrowed down to the reviews you gave other people.",
        stat: { value: fmt(totals.reviews), label: "reviews given to other people" },
      };
    case "shore-leave":
      if (year.quiet.length < 3) return null;
      return {
        chart: {
          type: "ticks",
          values: year.days.map((day) => day.count),
          gap: {
            from: year.quiet.start,
            to: year.quiet.start + year.quiet.length - 1,
            label: `${year.quiet.length} days off`,
          },
        },
        description: "The days around your longest break. Where the line runs flat, you were somewhere else.",
        stat: { value: fmt(year.quiet.length), label: "days off in a row, your longest break" },
      };
    case "many-tongues":
      if (year.languages.length < 2) return null;
      return {
        chart: { type: "rings", parts: year.languages.slice(0, 4) },
        description: "Your languages, by share of what you wrote. More than one of them got real use.",
        stat: {
          value: String(languagesInUse(year)),
          label: "languages that got real use",
        },
      };
    default:
      return null;
  }
}

/** The week as seven bars, Monday first, the busiest one lit. */
export function weekBars(year: SampleYear) {
  const peak = year.weekdays.indexOf(Math.max(...year.weekdays));
  return {
    peak,
    bars: MONDAY_FIRST.map((weekday, index) => ({
      label: WEEKDAY_LETTERS[index],
      value: year.weekdays[weekday],
      peak: weekday === peak,
    })),
  };
}
