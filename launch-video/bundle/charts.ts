import { CHART_EXAMPLES } from "../../apps/docs/src/registry/charts";

/** Every chart the library draws, once each, on the numbers its docs page leads with: the film's wall of 21. */
export const CHART_WALL = CHART_EXAMPLES.filter(
  (example, index) => CHART_EXAMPLES.findIndex((other) => other.chart.type === example.chart.type) === index,
).map(({ name, chart }) => ({ name, chart }));
