import { afterEach, describe, expect, test } from "bun:test";
import { cloneConfigItems } from "@/config/clone";

describe("cloneConfigItems", () => {
  afterEach(() => {
    (globalThis as { structuredClone?: typeof structuredClone }).structuredClone =
      originalStructuredClone;
  });

  const originalStructuredClone = globalThis.structuredClone;

  test("uses structuredClone when available", () => {
    const input = { app: { name: "IOC" } };

    const cloned = cloneConfigItems(input);
    expect(cloned).toEqual(input);
    expect(cloned).not.toBe(input);
    expect(cloned.app).not.toBe(input.app);
  });

  test("falls back to JSON clone when structuredClone is unavailable", () => {
    (globalThis as { structuredClone?: typeof structuredClone }).structuredClone = undefined;

    const input = { app: { name: "IOC" } };
    const cloned = cloneConfigItems(input);

    expect(cloned).toEqual(input);
    expect(cloned).not.toBe(input);
    expect(cloned.app).not.toBe(input.app);
  });
});
