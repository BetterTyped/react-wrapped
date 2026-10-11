import type { SampleTraits } from "./traits";
import {
  dropVisual,
  monthChart,
  peakBars,
  repositoryShares,
  runningTotal,
  sparkOver,
  thenAndNow,
  weekBars,
  yearShape,
} from "./visuals";
import {
  formatMonthYear,
  formatShort,
  hoursOfDay,
  SAMPLE_CAPTION,
  samplePeriod,
  type SampleYear,
  weeklyTotals,
} from "./year";
import { hourName, type InsightCardSpec } from "@react-wrapped/core";

/*
 * The cards a year hands its owner to keep, besides the share card: a number, the chart that shows it, and the line
 * that says what the chart shows. One per achievement that draws a chart, then the year itself, part by part,
 * wherever an achievement has not already told that part.
 */

/** A card to keep. It is an `InsightCardSpec` as it stands, so it goes straight into `renderInsightCard`. */
export interface SampleInsight extends InsightCardSpec {
  /** Stable, for a key and a file name. */
  id: string;
  /** Set when the card is an achievement's: while the scan has not found that drop, the card stays locked. */
  traitId?: string;
}

/** The fewest cards any year gets. With the share card, that is ten graphics. */
export const MIN_INSIGHTS = 9;

const WEEKDAY_NAMES = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
const BUSIEST_WEEKS = 4;

const fmt = (count: number) => count.toLocaleString("en-US");
const pct = (share: number) => `${Math.round(share * 100)}%`;
const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/** The busiest run of `span` values in a row: where it starts and what it adds up to. */
function busiestStretch(values: readonly number[], span: number): { from: number; total: number } {
  let best = { from: 0, total: -1 };
  for (let from = 0; from + span <= values.length; from += 1) {
    const total = sum(values.slice(from, from + span));
    if (total > best.total) best = { from, total };
  }
  return best;
}

/**
 * Every card this year can be kept as, the achievements' first, hardest first. Nine of the year's own cards need
 * nothing but the days, so even a year with three contributions in it gets `MIN_INSIGHTS`. A year's card is only
 * left out when an achievement already drew that picture, and that achievement's card stands in its place.
 */
export function sampleInsights(year: SampleYear, traits: SampleTraits): SampleInsight[] {
  const { totals } = year;
  const base = { handle: year.handle, caption: `${SAMPLE_CAPTION}, ${samplePeriod(year)}` };

  const earned = traits.earned.flatMap((trait): SampleInsight[] => {
    const visual = dropVisual(trait, year);
    if (!visual) return [];
    return [
      {
        ...base,
        id: trait.id,
        traitId: trait.id,
        name: trait.name,
        rarity: trait.rarity,
        stat: visual.stat,
        insight: visual.description,
        chart: visual.chart,
      },
    ];
  });
  // What the achievements already show: the year's own card for the same picture would say it twice.
  const told = new Set(earned.map((insight) => insight.id));

  const cards: SampleInsight[] = [];
  const add = (id: string, card: Pick<SampleInsight, "name" | "stat" | "insight" | "chart">) =>
    cards.push({ ...base, id, ...card });
  const weeks = weeklyTotals(year);
  const perDay = (totals.contributions / year.days.length).toFixed(1);

  /* ---------- Nine cards any year has ---------- */

  // 1. The whole year as one line, its busiest four weeks selected.
  const busiest = busiestStretch(weeks, BUSIEST_WEEKS);
  add("year", {
    name: "The year",
    stat: { value: fmt(totals.contributions), label: "contributions in twelve months" },
    insight: `Contributions per week. That is ${perDay} a day, on ${totals.activeDays} active days out of ${year.days.length}.`,
    chart: {
      type: "spark",
      values: weeks,
      band:
        totals.contributions > 0
          ? { from: busiest.from, to: busiest.from + BUSIEST_WEEKS - 1, label: `${fmt(busiest.total)} in four weeks` }
          : undefined,
    },
  });

  // 2. The running total, with the week it got halfway.
  if (!told.has("four-digits")) {
    const { totals: climb, crossed } = runningTotal(year, totals.contributions / 2);
    const halfway = totals.contributions > 0 ? (crossed ?? 0) : 0;
    add("climb", {
      name: "The climb",
      stat: { value: String(halfway + 1), label: "weeks to reach the first half of your contributions" },
      insight: `Your running total, week by week, all the way to ${fmt(totals.contributions)}. The lit cell is halfway.`,
      chart: { type: "pixels", values: climb, mark: { index: halfway, label: "Halfway" } },
    });
  }

  // 3. The week, by weekday.
  const week = weekBars(year);
  add("week", {
    name: "The week",
    stat: {
      value: pct(year.weekdays[week.peak] / Math.max(1, totals.contributions)),
      label: `of your work landed on ${WEEKDAY_NAMES[week.peak]}`,
    },
    insight: `Contributions by weekday, Monday first. ${WEEKDAY_NAMES[week.peak]} carried the most.`,
    chart: { type: "bars", bars: week.bars },
  });

  // 4. Weekends against weekdays.
  add("weekend", {
    name: "The weekend",
    stat: { value: pct(year.weekendShare), label: "of your work happened on a Saturday or a Sunday" },
    insight: "Every hundred contributions as a hundred dots. The lit ones landed on a weekend.",
    chart: {
      type: "dots",
      share: year.weekendShare,
      label: `${Math.round(year.weekendShare * 100)} in every 100`,
      from: "weekends",
      to: "weekdays",
    },
  });

  // 5. The last twelve months around a ring. A window that starts mid-month has thirteen; the oldest is left out.
  if (!told.has("all-weather")) {
    const months = year.months.slice(-12);
    const best = months.reduce((top, month) => (month.total > top.total ? month : top), months[0]);
    add("months", {
      name: "The months",
      stat: {
        value: pct(best.total / Math.max(1, totals.contributions)),
        label: `of the year happened in ${best.name}, your biggest month`,
      },
      insight: "Contributions, month by month around the year. The brighter the segment, the busier the month.",
      chart: { type: "wheel", segments: months.map((month) => ({ label: month.label, value: month.total })) },
    });
  }

  // 6. The biggest day, with the two weeks around it.
  if (!told.has("launch-day")) {
    const normal = (totals.contributions / Math.max(1, totals.activeDays)).toFixed(1);
    add("peak", {
      name: "The peak",
      stat: {
        value: fmt(year.busiest.count),
        label: `contributions on ${formatShort(year.busiest.date)}, your biggest day`,
      },
      insight: `Two weeks around your biggest day. A normal active day for you is about ${normal}.`,
      chart: peakBars(year),
    });
  }

  // 7. How much of the calendar was active.
  add("calendar", {
    name: "The calendar",
    stat: { value: String(totals.activeDays), label: `active days out of ${year.days.length}` },
    insight: "A dial for the year. It fills as far as the share of days that had something on them.",
    chart: { type: "gauge", share: totals.activeDays / year.days.length },
  });

  // 8. Every week of the year, lit by how much it held.
  add("weeks", {
    name: "The weeks",
    stat: {
      value: String(weeks.filter((total) => total > 0).length),
      label: `weeks out of ${weeks.length} had something in them`,
    },
    insight: "One pill per week of your year, first to last. The brighter the pill, the busier the week.",
    chart: { type: "meter", pills: weeks, from: formatMonthYear(year.from), to: formatMonthYear(year.to) },
  });

  // 9. The year as one outline.
  const shape = yearShape(year);
  add("shape", {
    name: "The shape",
    stat: shape.stat,
    insight: "Six ways to measure a year, each against a mark that is hard to reach.",
    chart: shape.chart,
  });

  /* ---------- On top, when the year has more to say ---------- */

  const month = year.bestMonth;
  if (month && month.name !== (told.has("clean-sheet") ? year.fullMonth?.name : undefined)) {
    add("best-month", {
      name: month.name,
      stat: { value: fmt(month.total), label: `contributions in ${month.name}, your biggest month` },
      insight: `${month.name}, every day of it. The lit day is the busiest.`,
      chart: monthChart(month),
    });
  }

  if (year.streak.length >= 3 && !told.has("long-haul")) {
    add("streak", {
      name: "The streak",
      stat: { value: String(year.streak.length), label: "days in a row, without missing one" },
      insight: `Contributions per week. The lit stretch runs from ${formatShort(year.streak.from)} to ${formatShort(year.streak.to)}.`,
      chart: sparkOver(year, year.streak, `${year.streak.length} days`),
    });
  }

  if (year.previous.contributions > 0 && !told.has("second-wind")) {
    const change = totals.contributions / year.previous.contributions - 1;
    add("last-year", {
      name: "Then and now",
      stat: {
        value: `${change >= 0 ? "+" : "-"}${pct(Math.abs(change))}`,
        label: change >= 0 ? "more contributions than the year before" : "fewer contributions than the year before",
      },
      insight: "This year against last. The ring is where last year ended, the dot is where this one did.",
      chart: thenAndNow(year),
    });
  }

  const day = hoursOfDay(year);
  if (sum(day) > 0) {
    if (!told.has("night-watch")) {
      add("clock", {
        name: "The clock",
        stat: { value: hourName(day.indexOf(Math.max(...day))), label: "is the hour you commit at the most" },
        insight: "Your day, hour by hour. The lit hour is the busiest.",
        chart: { type: "clock", hours: day },
      });
    }
    const slot = year.hours.reduce(
      (best, row, weekday) =>
        row.reduce((inner, value, hour) => (value > inner.value ? { weekday, hour, value } : inner), best),
      { weekday: 0, hour: 0, value: 0 },
    );
    add("hours", {
      name: "The week by the hour",
      stat: {
        value: hourName(slot.hour),
        // The rows start on Monday, the names on Sunday.
        label: `on ${WEEKDAY_NAMES[(slot.weekday + 1) % 7]} is your busiest hour of the week`,
      },
      insight: "Your week, hour by hour. The lit cell is the busiest slot.",
      chart: { type: "hours", rows: year.hours },
    });
  }

  const [repository] = year.repositories;
  const shares = repositoryShares(year);
  if (repository && shares.length >= 2 && !told.has("home-base")) {
    add("repositories", {
      name: "The repositories",
      stat: { value: fmt(repository.commits), label: `commits went into ${repository.name}, your busiest repository` },
      insight: "Where your commits went. Every repository is sized by its share of them.",
      chart: { type: "bubbles", parts: shares },
    });
  }

  const [language] = year.languages;
  if (language && year.languages.length >= 2 && !told.has("many-tongues")) {
    add("languages", {
      name: "The languages",
      stat: { value: `${language.share}%`, label: `of what you wrote was ${language.name}` },
      insight: "Your languages, by share of what you wrote.",
      chart: { type: "rings", parts: year.languages.slice(0, 4) },
    });
  }

  if (year.quiet.length >= 3 && !told.has("shore-leave")) {
    add("quiet", {
      name: "The quiet stretch",
      stat: { value: String(year.quiet.length), label: "quiet days in a row, and then you were back" },
      insight: "The days around your longest break. Where the line runs flat, you were somewhere else.",
      chart: {
        type: "ticks",
        values: year.days.map((item) => item.count),
        gap: {
          from: year.quiet.start,
          to: year.quiet.start + year.quiet.length - 1,
          label: `${year.quiet.length} quiet days`,
        },
      },
    });
  }

  return [...earned, ...cards];
}
