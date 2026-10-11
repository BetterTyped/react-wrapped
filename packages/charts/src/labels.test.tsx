import { render } from "@testing-library/react";

import { Chart, hourName, type SceneChart } from "./charts";
import { WrappedProvider } from "@react-wrapped/core";

/** A week where the one busy slot is Friday at three in the afternoon. Rows start on Monday. */
const WEEK: SceneChart = {
  type: "hours",
  rows: Array.from({ length: 7 }, (_row, day) =>
    Array.from({ length: 24 }, (_cell, hour) => (day === 4 && hour === 15 ? 9 : 0)),
  ),
};

const textsOf = (container: HTMLElement) => [...container.querySelectorAll("text")].map((text) => text.textContent);

describe("the charts' labels", () => {
  it("names hours and weekdays in English when no provider is on the page", () => {
    // Act
    const { container } = render(<Chart chart={WEEK} />);
    const texts = textsOf(container);

    // Assert
    expect(texts).toContain("Fridays, 3 pm");
    expect(texts.slice(0, 7)).toEqual(["M", "T", "W", "T", "F", "S", "S"]);
    expect(texts).toEqual(expect.arrayContaining(["12 am", "6 am", "12 pm", "6 pm"]));
  });

  it("takes hours, weekdays and how they are joined from the provider", () => {
    // Arrange
    const hour = vi.fn<(hour: number) => string>((value) => `${value}:00`);

    // Act
    const { container } = render(
      <WrappedProvider
        labels={{
          charts: {
            hour,
            weekday: (day) => ["poniedziałki", "wtorki", "środy", "czwartki", "piątki", "soboty", "niedziele"][day],
            weekdayLetter: (day) => "PWŚCPSN"[day],
            weekdayHour: (weekday, time) => `${weekday} o ${time}`,
          },
        }}
      >
        <Chart chart={WEEK} />
      </WrappedProvider>,
    );
    const texts = textsOf(container);

    // Assert
    expect(hour).toHaveBeenCalledWith(15);
    expect(texts).toContain("piątki o 15:00");
    expect(texts.slice(0, 7)).toEqual(["P", "W", "Ś", "C", "P", "S", "N"]);
    expect(texts).toEqual(expect.arrayContaining(["0:00", "6:00", "12:00", "18:00"]));
  });

  it("says a count that started from nothing is new, in the provider's word when there is one", () => {
    // Arrange
    const chart: SceneChart = { type: "dumbbell", rows: [{ label: "Reviews", was: 0, now: 12 }] };

    // Act
    const plain = textsOf(render(<Chart chart={chart} />).container);
    const reworded = textsOf(
      render(
        <WrappedProvider labels={{ charts: { new: "nowe" } }}>
          <Chart chart={chart} />
        </WrappedProvider>,
      ).container,
    );

    // Assert
    expect(plain).toContain("new");
    expect(reworded).toContain("nowe");
    expect(reworded).not.toContain("new");
  });

  it("keeps hourName in English for a director's own lines", () => {
    // Act
    const names = [0, 9, 12, 15, 23].map(hourName);

    // Assert
    expect(names).toEqual(["12 am", "9 am", "12 pm", "3 pm", "11 pm"]);
  });
});
