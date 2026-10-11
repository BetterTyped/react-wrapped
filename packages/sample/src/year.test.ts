import { SAMPLE_YEAR_END, sampleYear, yearFromCounts } from "./year";

const iso = (date: Date) => date.toISOString().slice(0, 10);
const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

describe("the sample year", () => {
  it("is the same year every time it is made for the same handle", () => {
    // Arrange
    const first = sampleYear("ada");

    // Act
    const again = sampleYear("ada");
    const other = sampleYear("grace");

    // Assert
    expect(again).toEqual(first);
    expect(other.days.map((day) => day.count)).not.toEqual(first.days.map((day) => day.count));
  });

  it("covers the 365 days up to a fixed date, whatever today is", () => {
    // Arrange
    const year = sampleYear();

    // Act
    const window = { days: year.days.length, from: iso(year.from), to: iso(year.to), handle: year.handle };

    // Assert
    expect(window).toEqual({ days: 365, from: "2025-10-11", to: SAMPLE_YEAR_END, handle: "ada" });
  });

  it("looks like a working year: busy weekdays, a long streak, a quiet gap and one day above all others", () => {
    // Arrange
    const year = sampleYear("ada");
    const [sunday, monday, tuesday, wednesday, thursday, friday, saturday] = year.weekdays;

    // Act
    const quietestWorkday = Math.min(monday, tuesday, wednesday, thursday, friday);
    const others = year.days.filter((day) => day !== year.busiest).map((day) => day.count);
    const streakEnd = year.streak.start + year.streak.length;
    const quietEnd = year.quiet.start + year.quiet.length;

    // Assert
    expect(quietestWorkday).toBeGreaterThan(Math.max(saturday, sunday) * 2);
    expect(year.streak.length).toBeGreaterThanOrEqual(30);
    expect(year.quiet.length).toBeGreaterThanOrEqual(7);
    expect(quietEnd <= year.streak.start || streakEnd <= year.quiet.start).toBe(true);
    expect(year.busiest.count).toBeGreaterThan(Math.max(...others));
  });

  it("adds up: every total is the sum of the days it is made of", () => {
    // Arrange
    const year = sampleYear("ada");
    const counts = year.days.map((day) => day.count);

    // Act
    const totals = {
      weekdays: sum(year.weekdays),
      months: sum(year.months.map((month) => month.total)),
      activeDays: counts.filter((count) => count > 0).length,
      languages: sum(year.languages.map((language) => language.share)),
    };

    // Assert
    expect(totals.weekdays).toBe(year.totals.contributions);
    expect(totals.months).toBe(year.totals.contributions);
    expect(totals.activeDays).toBe(year.totals.activeDays);
    expect(totals.languages).toBe(100);
    expect(year.previous.contributions).toBeLessThan(year.totals.contributions);
    expect(year.hours.map((row) => row.length)).toEqual([24, 24, 24, 24, 24, 24, 24]);
  });
});

describe("a year worked out from its days", () => {
  // Jan 25 to Mar 10, 2026: a week of January, all of February with something on every day, ten empty days of March.
  const january = [3, 0, 0, 0, 0, 2, 0];
  const february = Array.from({ length: 28 }, (_unused, index) => (index === 13 ? 9 : 1));
  const march = Array.from({ length: 10 }, () => 0);
  const year = yearFromCounts({
    handle: "ada",
    end: "2026-03-10",
    counts: [...january, ...february, ...march],
    pullRequests: 0,
    reviews: 0,
    previous: { contributions: 0, commits: 0, pullRequests: 0, reviews: 0, activeDays: 0 },
    repositories: [],
    languages: [
      { name: "Go", color: "#00add8", weight: 1 },
      { name: "Rust", color: "#dea584", weight: 3 },
    ],
    hours: [],
  });

  it("finds the longest streak and the biggest day", () => {
    // Arrange
    const { streak, busiest } = year;

    // Act
    const found = { from: iso(streak.from), to: iso(streak.to), length: streak.length, peak: iso(busiest.date) };

    // Assert
    expect(found).toEqual({ from: "2026-02-01", to: "2026-02-28", length: 28, peak: "2026-02-14" });
  });

  it("counts a break only between two active days, never the empty days the window ends on", () => {
    // Arrange
    const { quiet } = year;

    // Act
    const found = { from: iso(quiet.from), to: iso(quiet.to), length: quiet.length };

    // Assert
    expect(found).toEqual({ from: "2026-01-26", to: "2026-01-29", length: 4 });
  });

  it("only calls a calendar month whole when the window holds all of it", () => {
    // Arrange
    const { fullMonth, bestMonth } = year;

    // Act
    const names = { full: fullMonth?.name, best: bestMonth?.name, lead: fullMonth?.lead, days: fullMonth?.days.length };

    // Assert
    expect(names).toEqual({ full: "February", best: "February", lead: 6, days: 28 });
  });

  it("turns language weights into shares, biggest first", () => {
    // Arrange
    const { languages } = year;

    // Act
    const shares = languages.map((language) => `${language.name} ${language.share}`);

    // Assert
    expect(shares).toEqual(["Rust 75", "Go 25"]);
  });
});
