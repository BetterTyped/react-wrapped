import { render, screen } from "@testing-library/react";

import { Chips } from "../chips";
import { WrappedProvider } from "../labels";
import type { SlotClassNames } from "../slots";
import { useSlots } from "./slots";
import { Switch } from "./switch";

type ProbeSlot = "probe" | "probe-bare";

/** Two elements named the way a chrome component names its parts: one with classes of the library's, one with none. */
function Probe({ classNames }: { classNames?: SlotClassNames<ProbeSlot> }) {
  const slot = useSlots<ProbeSlot>(classNames);
  return (
    <>
      <button type="button" {...slot("probe", "wr:rounded-full wr:bg-foreground", false, "wr:px-4")}>
        Play
      </button>
      <span {...slot("probe-bare")}>bare</span>
    </>
  );
}

describe("useSlots", () => {
  it("names the element and leaves the library's classes as they were when nobody adds any", () => {
    // Act
    render(<Probe />);

    // Assert
    const button = screen.getByRole("button", { name: "Play" });
    expect(button).toHaveAttribute("data-wr-slot", "probe");
    expect(button).toHaveAttribute("class", "wr:rounded-full wr:bg-foreground wr:px-4");
    // An element with no class of the library's does not grow an empty attribute.
    expect(screen.getByText("bare")).toHaveAttribute("data-wr-slot", "probe-bare");
    expect(screen.getByText("bare")).not.toHaveAttribute("class");
  });

  it("puts a class given for a slot after the library's own", () => {
    // Act
    render(<Probe classNames={{ probe: "mine", "probe-bare": "only-mine" }} />);

    // Assert
    expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute(
      "class",
      "wr:rounded-full wr:bg-foreground wr:px-4 mine",
    );
    expect(screen.getByText("bare")).toHaveAttribute("class", "only-mine");
  });

  it("takes the provider's class first and the component's own after it", () => {
    // Act
    render(
      <WrappedProvider classNames={{ probe: "from-provider", "probe-bare": "bare-from-provider" }}>
        <Probe classNames={{ probe: "from-prop" }} />
      </WrappedProvider>,
    );

    // Assert
    expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute(
      "class",
      "wr:rounded-full wr:bg-foreground wr:px-4 from-provider from-prop",
    );
    expect(screen.getByText("bare")).toHaveAttribute("class", "bare-from-provider");
  });

  it("lets a provider further down restyle one slot and keep the rest, the way labels merge", () => {
    // Act
    render(
      <WrappedProvider classNames={{ probe: "outer", "probe-bare": "outer-bare" }}>
        <WrappedProvider classNames={{ probe: "inner", "probe-bare": undefined }}>
          <Probe />
        </WrappedProvider>
      </WrappedProvider>,
    );

    // Assert
    const button = screen.getByRole("button", { name: "Play" });
    expect(button).toHaveClass("inner");
    expect(button).not.toHaveClass("outer");
    // A slot set to undefined is a slot left out.
    expect(screen.getByText("bare")).toHaveAttribute("class", "outer-bare");
  });

  it("lets one of the library's own utilities given for a slot replace the one it contradicts", () => {
    // Act
    render(<Probe classNames={{ probe: "wr:rounded-none" }} />);

    // Assert
    const button = screen.getByRole("button", { name: "Play" });
    expect(button).toHaveClass("wr:rounded-none");
    expect(button).not.toHaveClass("wr:rounded-full");
  });

  it("keeps a provider that only translates out of the way of slots set above it", () => {
    // Act
    render(
      <WrappedProvider classNames={{ probe: "outer" }}>
        <WrappedProvider labels={{ player: { play: "Odtwórz" } }}>
          <Probe />
        </WrappedProvider>
      </WrappedProvider>,
    );

    // Assert
    expect(screen.getByRole("button", { name: "Play" })).toHaveClass("outer");
  });
});

describe("the shared pieces", () => {
  it("lets the component using a row of chips name the row and each chip", () => {
    // Act
    render(
      <Chips
        label="Speed"
        value="1"
        options={[
          { value: "1", label: "1x" },
          { value: "2", label: "2x" },
        ]}
        onChange={() => {}}
        slots={{
          group: { "data-wr-slot": "settings-chips", className: "row" },
          chip: { "data-wr-slot": "settings-chip", className: "pick" },
        }}
      />,
    );

    // Assert
    const group = screen.getByRole("radiogroup", { name: "Speed" });
    expect(group).toHaveAttribute("data-wr-slot", "settings-chips");
    expect(group.className).toMatch(/^wr-root wr:flex .* row$/);
    for (const chip of screen.getAllByRole("radio")) {
      expect(chip).toHaveAttribute("data-wr-slot", "settings-chip");
      expect(chip.className).toMatch(/^wr:inline-flex .* pick$/);
    }
  });

  it("draws the chips exactly as before when nobody names them", () => {
    // Act
    render(<Chips label="Speed" value="1" options={[{ value: "1", label: "1x" }]} onChange={() => {}} />);

    // Assert
    expect(screen.getByRole("radiogroup", { name: "Speed" })).not.toHaveAttribute("data-wr-slot");
    expect(screen.getByRole("radiogroup", { name: "Speed" })).toHaveAttribute(
      "class",
      "wr-root wr:flex wr:w-fit wr:flex-wrap wr:items-center wr:gap-1.5",
    );
    expect(screen.getByRole("radio", { name: "1x" })).not.toHaveAttribute("data-wr-slot");
  });

  it("lets the component using a switch name it and the dot that slides in it", () => {
    // Act
    render(
      <Switch
        checked
        onCheckedChange={() => {}}
        aria-label="Film grain"
        data-wr-slot="settings-switch"
        className="track"
        thumb={{ "data-wr-slot": "settings-switch-thumb", className: "dot" }}
      />,
    );

    // Assert
    const button = screen.getByRole("switch", { name: "Film grain" });
    expect(button).toHaveAttribute("data-wr-slot", "settings-switch");
    expect(button.className).toMatch(/^wr:peer .* track$/);
    expect(button.firstElementChild).toHaveAttribute("data-wr-slot", "settings-switch-thumb");
    expect(button.firstElementChild?.className).toMatch(/^wr:pointer-events-none .* dot$/);
  });
});
