import { calendarFromCounts } from "./primitives";

const utc = (date: string) => new Date(`${date}T00:00:00Z`);

describe("calendarFromCounts", () => {
  it("levels the active days by quartile and leaves empty days at zero", () => {
    // Arrange: eight active days from 1 to 8, with empty days between them.
    const counts = [0, 1, 2, 3, 0, 4, 5, 6, 7, 8, 0];

    // Act
    const { levels } = calendarFromCounts(counts, utc("2026-03-01"));

    // Assert
    expect(levels).toEqual([0, 1, 1, 2, 0, 2, 3, 3, 4, 4, 0]);
  });

  it("does not let one huge day push every other day to the lowest level", () => {
    // Arrange
    const counts = [2, 2, 3, 3, 4, 4, 500];

    // Act
    const { levels } = calendarFromCounts(counts, utc("2026-03-01"));

    // Assert
    expect(levels).toEqual([1, 1, 2, 2, 3, 3, 4]);
  });

  it("gives a year with nothing in it a level of zero on every day", () => {
    // Act
    const { levels } = calendarFromCounts([0, 0, 0], utc("2026-03-01"));

    // Assert
    expect(levels).toEqual([0, 0, 0]);
  });

  it("starts the first column on the weekday of the first day, Sunday being zero", () => {
    // Act: 2025-10-11 was a Saturday, 2026-03-01 a Sunday.
    const leads = [
      calendarFromCounts([1], utc("2025-10-11")).lead,
      calendarFromCounts([1], utc("2026-03-01")).lead,
      // Late in the evening in UTC is still that UTC day, whatever the machine's own zone says.
      calendarFromCounts([1], new Date("2026-03-01T23:30:00Z")).lead,
    ];

    // Assert
    expect(leads).toEqual([6, 0, 0]);
  });

  it("names every month the days touch, thirteen for a year that starts mid-month", () => {
    // Arrange
    const counts = Array.from({ length: 365 }, () => 1);

    // Act
    const { months } = calendarFromCounts(counts, utc("2025-10-11"));

    // Assert
    expect(months).toEqual(["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"]);
  });

  it("names the months in the locale it is given", () => {
    // Act
    const { months } = calendarFromCounts([1, 1], utc("2026-05-31"), "pl-PL");

    // Assert
    expect(months).toEqual(["maj", "cze"]);
  });
});
