import { render } from "@testing-library/react";

import * as icons from "./icons";

describe("icons", () => {
  it.each(Object.entries(icons))("%s is a 24 by 24 outline that takes its class and fill", (_name, Icon) => {
    // Act
    const { container } = render(<Icon className="wr:size-4" fill="currentColor" />);
    const svg = container.querySelector("svg");

    // Assert
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("stroke-width", "2");
    expect(svg).toHaveAttribute("stroke-linecap", "round");
    expect(svg).toHaveAttribute("stroke-linejoin", "round");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("fill", "currentColor");
    expect(svg).toHaveClass("wr:size-4");
    expect(svg?.children.length).toBeGreaterThan(0);
  });

  it("draws an outline when no fill is asked for", () => {
    // Act
    const { container } = render(<icons.Check />);

    // Assert
    expect(container.querySelector("svg")).toHaveAttribute("fill", "none");
  });
});
