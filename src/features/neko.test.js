import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLocalReply, getMood, isCrisisMessage } from "./neko";

const TODAY = "2026-06-04";

function habit(completedDates) {
  return { id: 1, name: "h", emoji: "🌸", color: "#fff", completedDates };
}

describe("getMood lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 4, 12, 0)); // local noon
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("never shows sad or lonely to a brand-new user", () => {
    const fresh = [habit([]), habit([])];
    const mood = getMood(fresh, TODAY);
    expect(["welcome", "sleepy", "content"]).toContain(mood);
    expect(mood).not.toBe("sad");
    expect(mood).not.toBe("lonely");
  });

  it("celebrates a full day", () => {
    expect(getMood([habit([TODAY])], TODAY)).toBe("blissful");
  });

  it("celebrates a brand-new user's very first tiny win (not 'welcome')", () => {
    // 1 of 4 done on day one (pct < 0.34, no history) → happy, never welcome.
    const firstDay = [habit([TODAY]), habit([]), habit([]), habit([])];
    expect(getMood(firstDay, TODAY)).toBe("happy");
  });

  it("does a full day after a break still celebrates, never guilts", () => {
    // One habit, done today after a 5-day gap → blissful (doing well wins).
    expect(getMood([habit(["2026-05-30", TODAY])], TODAY)).toBe("blissful");
  });

  it("welcomes a returning user who did a little after a break, not guilt", () => {
    // 1 of 4 done today (partial) after a 5-day gap → recovered, not sad.
    const recovering = [habit(["2026-05-30", TODAY]), habit([]), habit([]), habit([])];
    expect(getMood(recovering, TODAY)).toBe("recovered");
  });

  it("only shows lonely for an established relationship with a real gap", () => {
    // Built history, then a 4-day gap, nothing done today.
    expect(getMood([habit(["2026-05-29", "2026-05-30", "2026-05-31"])], TODAY)).toBe("lonely");
  });

  it("shows gentle sadness only after a short established gap", () => {
    expect(getMood([habit(["2026-06-02"])], TODAY)).toBe("sad");
  });
});

describe("crisis routing", () => {
  it.each([
    "I want to kill myself",
    "I might end my life",
    "I have been thinking about self-harm",
    "I want to hurt myself",
    "I might harm someone",
  ])("recognises an urgent message: %s", (message) => {
    expect(isCrisisMessage(message)).toBe(true);
  });

  it.each([
    "I need to kill time before dinner",
    "This task is hurting my progress",
    "I want help restarting my habits",
  ])("does not flag ordinary language: %s", (message) => {
    expect(isCrisisMessage(message)).toBe(false);
  });

  it("routes urgent language before ordinary coaching intents", () => {
    const reply = getLocalReply(
      "I want to kill myself and need a plan today",
      [habit([])],
      [],
      [],
      "Mina",
    );

    expect(reply).toContain("local emergency services or a crisis line");
    expect(reply).toContain("someone you trust");
    expect(reply).not.toContain("start with one easy care ritual");
  });
});

describe("local coaching summary", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 4, 12, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts a tiny version as care in the progress reply", () => {
    const reply = getLocalReply(
      "check my progress",
      [{ ...habit([]), tinyDates: [TODAY] }],
      [],
      [],
      "Mina",
    );
    expect(reply).toContain("1 of 1 care ritual complete");
  });
});
