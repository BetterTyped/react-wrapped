import { giveSvgABox, mountScene, playScene } from "../testing/stage";
import { fullYear, thinYear } from "../testing/years";
import { directSample } from "./director";
import { MIN_INSIGHTS, type SampleInsight, sampleInsights } from "./insights";
import { sampleTraits } from "./traits";
import { sampleYear, type SampleYear } from "./year";
import { chartScene } from "@react-wrapped/core";

const insightsOf = (year: SampleYear) => sampleInsights(year, sampleTraits(year));
const chartTypes = (insights: readonly SampleInsight[]) => new Set(insights.map((insight) => insight.chart.type));

/** What a chart writes into its markup when it divides by a count that was zero. */
const NOT_A_NUMBER = /NaN|undefined|Infinity/;

/** A card's chart on the scene the video would play it in. */
const onChartScene = (card: SampleInsight) =>
  chartScene(
    { eyebrow: card.stat.label, title: [card.name], chart: card.chart, lede: card.insight },
    { key: `card-${card.id}`, label: card.name },
  );

/** The cards with a name that says whose they are, for a test's title. */
const named = (year: string, cards: readonly SampleInsight[]) =>
  cards.map((card) => [`${year}: ${card.name}`, card] as const);

beforeAll(giveSvgABox);

describe("the cards a sample year hands out", () => {
  it.each([
    ["the default year", sampleYear("ada")],
    ["a year with three contributions", thinYear()],
    ["a year that earned everything", fullYear()],
  ])("gives %s at least nine cards, drawn with at least five kinds of chart", (_name, year) => {
    // Arrange
    const insights = insightsOf(year);

    // Act
    const ids = insights.map((insight) => insight.id);

    // Assert
    expect(insights.length).toBeGreaterThanOrEqual(MIN_INSIGHTS);
    expect(chartTypes(insights).size).toBeGreaterThanOrEqual(5);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("puts the achievements first, hardest first, each marked with the drop it belongs to", () => {
    // Arrange
    const year = sampleYear("ada");
    const traits = sampleTraits(year);

    // Act
    const insights = sampleInsights(year, traits);
    const earned = insights.filter((insight) => insight.traitId);

    // Assert
    expect(insights.slice(0, earned.length)).toEqual(earned);
    expect(earned.map((insight) => insight.traitId)).toEqual(traits.earned.map((trait) => trait.id));
    expect(earned.map((insight) => insight.rarity)).toEqual(traits.earned.map((trait) => trait.rarity));
  });

  it("does not draw the same picture twice: an achievement's card stands in for the year's own", () => {
    // Arrange
    const earnedIt = insightsOf(sampleYear("ada")).map((insight) => insight.id);
    const didNot = insightsOf(thinYear()).map((insight) => insight.id);

    // Act
    const pairs = [
      ["launch-day", "peak"],
      ["four-digits", "climb"],
      ["long-haul", "streak"],
    ];

    // Assert
    for (const [achievement, own] of pairs) {
      expect(earnedIt).toContain(achievement);
      expect(earnedIt).not.toContain(own);
    }
    expect(didNot).toEqual(expect.arrayContaining(["peak", "climb"]));
  });

  it("hands the same cards to the director, whatever has been opened", () => {
    // Arrange
    const year = sampleYear("ada");
    const traits = sampleTraits(year);

    // Act
    const closed = directSample(year, traits, []);
    const opened = directSample(year, traits, ["long-haul"]);

    // Assert
    expect(closed.insights).toEqual(insightsOf(year));
    expect(opened.insights).toEqual(closed.insights);
    expect(closed.insights.length + 1).toBeGreaterThanOrEqual(10);
  });

  it("says who and when on every card", () => {
    // Arrange
    const insights = insightsOf(sampleYear("ada"));

    // Act
    const captions = new Set(insights.map((insight) => `${insight.handle}: ${insight.caption}`));

    // Assert
    expect([...captions]).toEqual(["ada: Orbit Wrapped, Oct 2025 to Oct 2026"]);
  });
});

// Every card's chart is drawn on the engine's own chart scene. In jsdom that takes a while, so each gets a minute.
describe("the charts on the cards", () => {
  it.each(named("the default year", insightsOf(sampleYear("ada"))))(
    "%s is drawn and comes in",
    (_name, card) => {
      // Arrange
      const scene = onChartScene(card);

      // Act
      const figure = mountScene(scene).querySelector(".wr-chart");
      const seconds = playScene(scene, "story");

      // Assert
      expect(figure?.getAttribute("data-chart")).toBe(card.chart.type);
      expect(figure?.innerHTML).not.toMatch(NOT_A_NUMBER);
      expect(seconds).toBeGreaterThan(1);
    },
    60_000,
  );

  it.each(named("a year with three contributions", insightsOf(thinYear())))(
    "%s is drawn from real numbers, however few there are",
    (_name, card) => {
      // Arrange
      const scene = onChartScene(card);

      // Act
      const figure = mountScene(scene).querySelector(".wr-chart");

      // Assert
      expect(figure?.querySelector("svg")).not.toBeNull();
      expect(figure?.innerHTML).not.toMatch(NOT_A_NUMBER);
    },
    60_000,
  );
});
