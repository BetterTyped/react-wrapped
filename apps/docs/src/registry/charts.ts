import type { SceneChart } from "@react-wrapped/core";

/*
 * Every chart the library draws, on numbers made up to show it off. The docs give each one a page from this list,
 * and the designs page lays them all out side by side.
 */

/** A year's worth of made-up weekly numbers with some shape to them, the same on every render. */
const WEEKS = Array.from({ length: 52 }, (_unused, week) =>
  Math.round(18 + 14 * Math.sin(week / 3.1) + 10 * Math.sin(week / 1.3 + 2) + ((week * 37) % 11)),
);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface ChartExample {
  name: string;
  says: string;
  chart: SceneChart;
}

/** One or more of every chart, on numbers made up to show it off. The first of each type leads that chart's page. */
export const CHART_EXAMPLES: readonly ChartExample[] = [
  {
    name: "Spark",
    says: "A line over time, one stretch lit.",
    chart: { type: "spark", values: WEEKS, band: { from: 20, to: 27, label: "41 days in a row" } },
  },
  {
    name: "Spark, crossing a line",
    says: "A running total and the moment it crossed a mark.",
    chart: {
      type: "spark",
      values: WEEKS.map((_value, week) => WEEKS.slice(0, week + 1).reduce((sum, value) => sum + value, 0) * 9),
      threshold: { value: 10_000, label: "10,000" },
    },
  },
  {
    name: "Bars",
    says: "Columns sharing one light, the ones that matter lit.",
    chart: {
      type: "bars",
      bars: [62, 88, 54, 96, 71, 22, 30].map((value, index) => ({ label: "MTWTFSS"[index], value, peak: index > 4 })),
    },
  },
  {
    name: "Bars, one towering",
    says: "One day against the days around it.",
    chart: {
      type: "bars",
      bars: [3, 1, 2, 4, 2, 1, 3, 52, 2, 1, 4, 3, 1, 2, 2].map((value) => ({ value, peak: value === 52 })),
      peakLabel: "52",
    },
  },
  {
    name: "Funnel",
    says: "A flow narrowing, stage by stage.",
    chart: {
      type: "funnel",
      steps: [
        { label: "Contributions", value: 2052 },
        { label: "Commits", value: 1527 },
        { label: "Reviews", value: 65 },
      ],
    },
  },
  {
    name: "Pulse",
    says: "Every day a stroke, the quiet stretch lit.",
    chart: {
      type: "ticks",
      values: Array.from({ length: 120 }, (_unused, day) => (day > 52 && day < 65 ? 0 : 1 + ((day * 7) % 9))),
      gap: { from: 53, to: 64, label: "12 days off" },
    },
  },
  {
    name: "Rings",
    says: "Parts of a whole, biggest outside.",
    chart: {
      type: "rings",
      parts: [
        { name: "TypeScript", color: "", share: 55 },
        { name: "Go", color: "", share: 25 },
        { name: "CSS", color: "", share: 13 },
        { name: "Shell", color: "", share: 7 },
      ],
    },
  },
  {
    name: "Donut",
    says: "One part against the rest.",
    chart: {
      type: "donut",
      parts: [
        { label: "Public", value: 707 },
        { label: "Private", value: 380 },
      ],
      centre: "35%",
    },
  },
  {
    name: "Days",
    says: "A short run of dates, the ones that matter ringed.",
    chart: {
      type: "days",
      days: [
        { label: "23", sub: "Dec", level: 2, count: 2 },
        { label: "24", sub: "Eve", level: 4, count: 9, marked: true },
        { label: "25", sub: "Xmas", level: 4, count: 16, marked: true },
        { label: "26", sub: "Dec", level: 0, count: 0 },
        { label: "30", sub: "Dec", level: 1, count: 1 },
        { label: "31", sub: "NYE", level: 1, count: 1, marked: true },
        { label: "1", sub: "New Year", level: 3, count: 8, marked: true },
      ],
    },
  },
  { name: "Dial", says: "A share, as lit segments.", chart: { type: "gauge", share: 0.74 } },
  {
    name: "Meter",
    says: "One pill per thing counted, lit where there was something.",
    chart: {
      type: "meter",
      pills: WEEKS.map((value, week) => (week % 5 === 3 || week % 7 === 2 ? 0 : value)),
      from: "Oct 2025",
      to: "Oct 2026",
      note: "38 of 52 Fridays",
    },
  },
  {
    name: "Pixel area",
    says: "A total climbing, in graph cells.",
    chart: {
      type: "pixels",
      values: WEEKS.map((_value, week) => WEEKS.slice(0, week + 1).reduce((sum, value) => sum + value, 0)),
      mark: { index: 44, label: "10,000" },
    },
  },
  {
    name: "Wheel",
    says: "A year around a ring, month by month.",
    chart: {
      type: "wheel",
      segments: MONTHS.map((label, month) => ({
        label,
        value: [22, 25, 28, 19, 30, 12, 8, 27, 29, 31, 26, 18][month],
      })),
    },
  },
  {
    name: "Day clock",
    says: "A day, hour by hour. The lit hour is the busiest.",
    chart: {
      type: "clock",
      hours: [5, 3, 1, 0, 0, 0, 1, 3, 6, 10, 12, 11, 8, 10, 13, 12, 10, 8, 6, 8, 11, 14, 16, 9],
    },
  },
  {
    name: "River",
    says: "Parts of a whole, month by month. One of them arrived halfway.",
    chart: {
      type: "river",
      ticks: [..."ONDJFMAMJJAS"],
      streams: [
        { name: "Rust", point: true, values: [0, 0, 0, 0, 0, 1, 8, 16, 24, 28, 34, 38] },
        { name: "TypeScript", values: [62, 64, 60, 58, 60, 57, 52, 46, 42, 40, 38, 36] },
        { name: "Go", values: [30, 28, 32, 30, 27, 28, 24, 22, 20, 20, 18, 18] },
      ],
      note: { index: 5, label: "Rust arrives" },
    },
  },
  {
    name: "Dot share",
    says: "A share as a hundred dots, the lit ones the part that counts.",
    chart: { type: "dots", share: 0.35, label: "35 in every 100", from: "private", to: "public" },
  },
  {
    name: "Then and now",
    says: "The ring is where last year ended, the dot is where this one did.",
    chart: {
      type: "dumbbell",
      rows: [
        { label: "Contributions", was: 1240, now: 2052 },
        { label: "Reviews", was: 22, now: 65 },
        { label: "Active days", was: 198, now: 263 },
        { label: "Pull requests", was: 61, now: 48 },
      ],
    },
  },
  {
    name: "Bubbles",
    says: "Parts of a whole as discs, sized by their share.",
    chart: {
      type: "bubbles",
      parts: [
        { name: "orbit/landing", share: 60 },
        { name: "ada/dotfiles", share: 20 },
        { name: "docs", share: 10 },
        { name: "api", share: 5 },
        { name: "9 more", share: 5 },
      ],
    },
  },
  {
    name: "Month up close",
    says: "One month, every day of it. The lit day is the biggest.",
    chart: {
      type: "month",
      lead: 2,
      days: [11, 14, 7, 1, 2, 12, 5, 7, 13, 7, 3, 4, 14, 9, 7, 8, 21, 3, 2, 13, 4, 12, 3, 7, 2, 3, 10, 11, 12, 7],
    },
  },
  {
    name: "Radar",
    says: "A year as one outline, against everyone else's.",
    chart: {
      type: "radar",
      note: "Streak: top 4%",
      axes: [
        { label: "Streak", value: 0.96, everyone: 0.5 },
        { label: "Commits", value: 0.82, everyone: 0.55 },
        { label: "Reviews", value: 0.42, everyone: 0.5 },
        { label: "Languages", value: 0.58, everyone: 0.45 },
        { label: "Weekends", value: 0.3, everyone: 0.5 },
        { label: "Pull requests", value: 0.66, everyone: 0.52 },
      ],
    },
  },
  {
    name: "Where you stand",
    says: "Everyone, fewest to most. The lit bar is where you are.",
    chart: {
      type: "standing",
      bars: Array.from({ length: 28 }, (_unused, index) =>
        Math.round(26 + Math.exp(-((index - 11) ** 2) / 46) * 190 + ((index * 37) % 14)),
      ),
      at: 24,
      label: "you: top 6%",
      from: "fewer days",
      to: "more days",
    },
  },
  {
    name: "Mirror",
    says: "What was added above the line, what was removed below it.",
    chart: {
      type: "mirror",
      pairs: Array.from({ length: 22 }, (_unused, week) => ({
        up: 400 + ((week * 613) % 1900),
        down: week === 8 ? 4210 : 180 + ((week * 421) % 900),
      })),
      up: "+48,120 written",
      down: "-31,406 deleted",
      mark: { index: 8, label: "4,210 gone in a week" },
    },
  },
  {
    name: "Week by hour",
    says: "A week, hour by hour. The lit cell is the busiest slot.",
    chart: {
      type: "hours",
      rows: Array.from({ length: 7 }, (_unused, day) =>
        Array.from({ length: 24 }, (_cell, hour) => {
          const work =
            day < 5
              ? Math.exp(-((hour - 14) ** 2) / 20) * (day === 4 ? 1.15 : 0.9)
              : Math.exp(-((hour - 21) ** 2) / 7) * 0.45;
          return Math.max(0, Math.round((work + (((day * 31 + hour * 17) % 10) - 5) / 45) * 20));
        }),
      ),
    },
  },
];

export type ChartType = SceneChart["type"];
type ChartOf<T extends ChartType> = Extract<SceneChart, { type: T }>;

/**
 * What the docs say about each chart. The props are keyed by the chart's own type, so a prop added to a chart
 * without a line here stops the build: the table on the page cannot fall behind the code.
 */
type ChartDocs = {
  [T in ChartType]: {
    /** The name people call it. */
    name: string;
    /** A few words after the name in the browser title. */
    tagline: string;
    /** The search result's line, 50 to 170 characters. */
    description: string;
    /** What it shows and when to reach for it. */
    lead: string;
    props: { [K in Exclude<keyof ChartOf<T>, "type">]-?: readonly [type: string, text: string] };
  };
};

export const CHART_DOCS: ChartDocs = {
  spark: {
    name: "Spark",
    tagline: "a glowing line over time",
    description:
      "A React line chart for a year of weekly values, with one stretch lit and an optional line to cross. Animated with GSAP.",
    lead: "Spark draws a year as one glowing line. Use it for anything that rises and falls over time, and light the stretch that matters: a streak, a launch week, the day a total crossed ten thousand.",
    props: {
      values: ["readonly number[]", "The values, oldest first. Weekly numbers read best: 52 points across the frame."],
      band: [
        "{ from: number; to: number; label: string }",
        "The stretch to light, as two indexes into `values`, and the note in the pill above it.",
      ],
      threshold: [
        "{ value: number; label: string }",
        "A dashed line to cross. A dot and a pill mark the first value that reaches it.",
      ],
    },
  },
  bars: {
    name: "Bars",
    tagline: "columns with the point lit",
    description:
      "A React bar chart where every column shares one light and the bars that matter are lit. Good for weekdays, months and one towering day.",
    lead: "Bars draws a row of columns under one shared glow. Mark the bars that make the point with `peak`, and they light up while the rest stay quiet.",
    props: {
      bars: [
        "readonly { label?: string; value: number; peak?: boolean }[]",
        "One column each. `label` goes under the column, `peak` lights it.",
      ],
      peakLabel: ["string", "A number or a note in a pill above the tallest lit column."],
    },
  },
  gauge: {
    name: "Dial",
    tagline: "a share as lit segments",
    description:
      "A React gauge chart: a dial of segments filled up to a share between 0 and 1. It carries no number, the scene's words say it.",
    lead: "Dial fills a half ring of segments up to a share. It shows how much of something without printing the number, so put the number in the scene's headline.",
    props: {
      share: ["number", "How much of the dial is lit, from 0 to 1."],
    },
  },
  meter: {
    name: "Meter",
    tagline: "one pill per thing counted",
    description:
      "A React meter chart: a row of slim pills, each lit by how much there was. Every Friday of a year, every week, every release.",
    lead: "Meter lines up one slim pill per thing counted and lights each by its value. Zero stays dark, which makes gaps as readable as peaks.",
    props: {
      pills: ["readonly number[]", "One value per pill. Zero is dark, the biggest value is the brightest."],
      from: ["string", "The label under the left end."],
      to: ["string", "The label under the right end."],
      note: ["string", "A note in a pill above the row."],
    },
  },
  pixels: {
    name: "Pixel area",
    tagline: "a total climbing in cells",
    description:
      "A React area chart built from square cells, like a contribution graph filling up. One cell can be marked with a label.",
    lead: "Pixel area stacks graph cells into columns, so a climbing total looks like the calendar it came from. Mark one cell to say when something happened.",
    props: {
      values: ["readonly number[]", "The height of each column, left to right."],
      mark: ["{ index: number; label: string }", "The column to mark, and the note in its pill."],
    },
  },
  wheel: {
    name: "Wheel",
    tagline: "a year around a ring",
    description:
      "A React radial chart: a ring cut into segments, each as bright as it was busy, with the biggest one named in the middle.",
    lead: "Wheel bends a cycle into a ring: twelve months, twenty-four hours, seven days. Each segment is as bright as its value, and the busiest one is named in the centre.",
    props: {
      segments: ["readonly { label: string; value: number }[]", "One segment each, clockwise from the top."],
    },
  },
  funnel: {
    name: "Funnel",
    tagline: "a flow narrowing by stage",
    description:
      "A React funnel chart: a flow that narrows step by step, each stage labelled with its own number. Three or four steps read best.",
    lead: "Funnel shows a total narrowing down, stage by stage. Use it when each step is a part of the one before it: everything, then commits, then reviews.",
    props: {
      steps: ["readonly { label: string; value: number }[]", "The stages, widest first."],
    },
  },
  ticks: {
    name: "Pulse",
    tagline: "every day as a stroke",
    description:
      "A React tick chart: every day of a stretch as one stroke, with the quiet gap bracketed and named. Made for breaks and comebacks.",
    lead: "Pulse draws one stroke per day, as tall as the day was busy, growing out from a centre line. The quiet stretch is bracketed and named, so a holiday reads at a glance.",
    props: {
      values: ["readonly number[]", "One value per day, oldest first."],
      gap: [
        "{ from: number; to: number; label: string }",
        "The quiet stretch, as two indexes into `values`, and its name.",
      ],
    },
  },
  rings: {
    name: "Rings",
    tagline: "parts as concentric rings",
    description:
      "A React rings chart: parts of a whole as concentric rings, the biggest outside. Each ring is drawn to its share in percent.",
    lead: "Rings draws each part of a whole as its own ring, biggest outside. Use it for a short list of shares, such as the languages a year was written in.",
    props: {
      parts: [
        "readonly { name: string; color: string; share: number }[]",
        "One ring each, biggest first. `share` is in percent. Leave `color` empty to use the palette.",
      ],
    },
  },
  donut: {
    name: "Donut",
    tagline: "one part against the rest",
    description:
      "A React donut chart for exactly two parts of a whole, with the second one lit and a number in the centre.",
    lead: "Donut sets one part against the rest. The second part is the point and is lit; the centre carries the number that says it.",
    props: {
      parts: [
        "readonly [{ label: string; value: number }, { label: string; value: number }]",
        "The two parts. The second is the one the chart is about.",
      ],
      centre: ["string", "The text in the middle, usually a percentage."],
    },
  },
  days: {
    name: "Days",
    tagline: "a short run of dates",
    description:
      "A React day strip: a short run of dates as cells with their counts, the days that matter ringed. Made for holidays and launch weeks.",
    lead: "Days shows a handful of dates side by side, each a cell lit by how busy it was, with the marked ones ringed. Use it when the story is about specific days.",
    props: {
      days: [
        "readonly { label: string; sub: string; level: number; count: number; marked?: boolean }[]",
        "One cell per day. `level` is 0 to 4 like a calendar cell, `sub` is the small line under the date.",
      ],
    },
  },
  clock: {
    name: "Day clock",
    tagline: "a day, hour by hour",
    description:
      "A React clock chart: 24 values around a clock face, midnight first, with the busiest hour lit and named.",
    lead: "Day clock wraps a day around a clock face. Hand it 24 values, midnight first, and it lights the busiest hour or the hour you mark. Use it to show when someone works: a night owl, an early bird.",
    props: {
      hours: ["readonly number[]", "24 values, midnight first."],
      mark: ["number", "The hour to light, 0 to 23. The busiest hour when left out."],
    },
  },
  river: {
    name: "River",
    tagline: "parts of a whole over time",
    description:
      "A React stream chart: parts of a whole as stacked ribbons over time. One stream can be the point, with a note at a moment on it.",
    lead: "River stacks ribbons, one per part, and lets them swell and thin over time. Use it to show a mix changing: one language arriving halfway through a year.",
    props: {
      ticks: ["readonly string[]", "The labels along the bottom."],
      streams: [
        "readonly { name: string; values: readonly number[]; point?: boolean }[]",
        "One ribbon each, first on top. `point` lights the one the chart is about.",
      ],
      note: ["{ index: number; label: string }", "A moment on the lit stream, and the note that marks it."],
    },
  },
  dots: {
    name: "Dot share",
    tagline: "a share as a hundred dots",
    description:
      "A React dot chart: a share from 0 to 1 drawn as a hundred dots, the lit ones the part that counts, with both ends named.",
    lead: "Dot share turns a percentage into a hundred dots and lights that many. It makes a share countable, which a ring never does.",
    props: {
      share: ["number", "The lit part, from 0 to 1."],
      label: ["string", "The note in the pill, in plain words."],
      from: ["string", "What the lit end is."],
      to: ["string", "What the dark end is."],
    },
  },
  dumbbell: {
    name: "Then and now",
    tagline: "last year against this one",
    description:
      "A React dumbbell chart: one row per thing counted, a ring where it was and a dot where it is now. The biggest jump is lit.",
    lead: "Then and now puts two years on one line per row: a ring for where it was, a dot for where it ended. The row with the biggest jump is lit unless you pick one.",
    props: {
      rows: ["readonly { label: string; was: number; now: number }[]", "One row per thing counted."],
      point: ["number", "The row to light. The biggest jump when left out."],
    },
  },
  bubbles: {
    name: "Bubbles",
    tagline: "parts of a whole as discs",
    description:
      "A React bubble chart: parts of a whole as packed discs sized by their share, biggest first. At most five are drawn.",
    lead: "Bubbles packs up to five discs, each sized by its share, with the biggest one lit. Use it when a few parts dominate and the rest do not matter.",
    props: {
      parts: ["readonly { name: string; share: number }[]", "Biggest first. `share` is in percent."],
    },
  },
  month: {
    name: "Month up close",
    tagline: "one month, every day of it",
    description: "A React month calendar chart: one cell per day laid out Monday to Sunday, with the biggest day lit.",
    lead: "Month up close zooms into one month and gives every day a cell. The biggest day is lit, so a full month or one huge day reads straight away.",
    props: {
      lead: ["number", "How many cells are empty before the 1st, counting from Monday."],
      days: ["readonly number[]", "One value per day of the month."],
    },
  },
  radar: {
    name: "Radar",
    tagline: "a year as one outline",
    description:
      "A React radar chart: one outline over several axes, turned so the strongest axis is on top, with everyone else's shape underneath.",
    lead: "Radar draws a year as one outline across several axes. The strongest axis is turned to the top and carries a note, and an `everyone` value on each axis draws the average shape under it.",
    props: {
      axes: [
        "readonly { label: string; value: number; everyone?: number }[]",
        "One axis each, values from 0 to 1. Give every axis an `everyone` to draw the comparison shape.",
      ],
      note: ["string", "The note on the strongest axis."],
    },
  },
  standing: {
    name: "Where you stand",
    tagline: "one place among many",
    description:
      "A React distribution chart: how many people sit at each step, fewest to most, with the bar where one person stands lit.",
    lead: "Where you stand draws everyone as a row of bars, fewest to most, and lights the one bar a person sits in. Use it for a percentile, such as more than 97 in every 100.",
    props: {
      bars: ["readonly number[]", "How many sit at each step, least to most."],
      at: ["number", "The index of the lit bar."],
      label: ["string", "The note above the lit bar."],
      from: ["string", "The label under the left end."],
      to: ["string", "The label under the right end."],
    },
  },
  mirror: {
    name: "Mirror",
    tagline: "added above, removed below",
    description:
      "A React mirrored bar chart: two things pulling against each other per period, one above the line and one below it.",
    lead: "Mirror draws one thing above a line and its opposite below it, period by period. Use it for added against removed, earned against spent, opened against closed.",
    props: {
      pairs: ["readonly { up: number; down: number }[]", "One pair per period, oldest first."],
      up: ["string", "What the bars above the line count."],
      down: ["string", "What the bars below the line count."],
      mark: ["{ index: number; label: string }", "One fall to light, and its note."],
    },
  },
  hours: {
    name: "Week by hour",
    tagline: "a week as a grid of hours",
    description: "A React heatmap chart: seven rows of 24 cells, Monday first, with the busiest slot of the week lit.",
    lead: "Week by hour lays a week out as a grid, a row per day and a cell per hour. The busiest slot is lit, or the one you mark.",
    props: {
      rows: ["readonly (readonly number[])[]", "Seven rows, Monday first, of 24 values each."],
      mark: ["{ day: number; hour: number }", "The slot to light. The busiest when left out."],
    },
  },
};

/** The chart types in the order the docs list them: the order their first example appears above. */
export const CHART_TYPES: readonly ChartType[] = [...new Set(CHART_EXAMPLES.map((example) => example.chart.type))];

export const examplesOf = (type: ChartType) => CHART_EXAMPLES.filter((example) => example.chart.type === type);
