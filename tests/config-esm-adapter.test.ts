import { describe, expect, test } from "bun:test";
import { loadConfig } from "@/config/adapters/esm";

describe("ESM config adapter", () => {
  test("loads config defaults from esm modules", () => {
    expect(
      loadConfig({
        "/src/config/app.ts": { default: { name: "App" } },
        "/src/config/cache.ts": { default: { driver: "memory" } },
        "/src/config/no-default.ts": { named: true },
        "/src/config/index.ts": { default: { ignored: true } },
      }),
    ).toEqual({
      app: { name: "App" },
      cache: { driver: "memory" },
    });
  });
});
