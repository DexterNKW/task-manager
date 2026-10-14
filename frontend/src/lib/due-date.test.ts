import { afterEach, describe, expect, it } from "vitest";
import { formatDueDate, toDateInputValue } from "./due-date";

const originalTimeZone = process.env.TZ;

afterEach(() => {
  process.env.TZ = originalTimeZone;
});

describe("formatDueDate", () => {
  it.each(["America/Los_Angeles", "UTC", "Europe/Rome", "Pacific/Kiritimati"])(
    "shows the stored calendar day in %s",
    (timeZone) => {
      process.env.TZ = timeZone;

      expect(formatDueDate("2026-10-20T00:00:00.000Z", "en-US")).toBe("10/20/2026");
    },
  );
});

describe("toDateInputValue", () => {
  it("returns the date part for the date input", () => {
    expect(toDateInputValue("2026-10-20T00:00:00.000Z")).toBe("2026-10-20");
  });

  it("returns an empty string when there is no due date", () => {
    expect(toDateInputValue(null)).toBe("");
  });
});
