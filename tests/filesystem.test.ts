import { afterEach, describe, expect, test } from "bun:test";
import { createConfig } from "@/config/discovery";
import { localAdapterTestingHelpers } from "@/filesystem/adapters/local_test.helpers";

describe("createConfig discovery", () => {
  afterEach(() => {
    (
      globalThis as {
        __iocConfigGlobForTests?: unknown;
      }
    ).__iocConfigGlobForTests = undefined;
  });

  test("loads config from ESM modules when no static items provided", () => {
    (
      globalThis as {
        __iocConfigGlobForTests?: (
          pattern: string | string[],
          options?: { eager?: boolean },
        ) => Record<string, unknown>;
      }
    ).__iocConfigGlobForTests = () => ({
      "/src/config/app.ts": { default: { name: "ESM App" } },
      "/src/config/cache.ts": { default: { driver: "memory" } },
    });

    const config = createConfig("./src");

    expect(config.get("app.name")).toBe("ESM App");
    expect(config.get("cache.driver")).toBe("memory");
  });

  test("skips ESM loading when static items are provided", () => {
    (
      globalThis as {
        __iocConfigGlobForTests?: (
          pattern: string | string[],
          options?: { eager?: boolean },
        ) => Record<string, unknown>;
      }
    ).__iocConfigGlobForTests = () => ({
      "/src/config/app.ts": { default: { name: "ESM App" } },
    });

    const config = createConfig("./src", { app: { name: "Static" } });

    // ESM modules should NOT be loaded when static items are provided
    expect(config.get("app.name")).toBe("Static");
  });

  test("returns independent repository instances", () => {
    const first = createConfig("./", { app: { name: "First" } });
    const second = createConfig("./", { app: { name: "Second" } });

    expect(first.get("app.name")).toBe("First");
    expect(second.get("app.name")).toBe("Second");

    // Mutations don't leak between instances
    first.set("app.name", "Modified");
    expect(first.get("app.name")).toBe("Modified");
    expect(second.get("app.name")).toBe("Second");
  });

  test("returns empty config when no glob implementation is available", () => {
    const config = createConfig("./", {});
    expect(config.all()).toEqual({});
  });

  describe("helper functions", () => {
    test("fileNameWithoutExtension handles various paths", () => {
      expect(localAdapterTestingHelpers.fileNameWithoutExtension("/src/config/app.ts")).toBe("app");
      expect(localAdapterTestingHelpers.fileNameWithoutExtension("app.ts")).toBe("app");
      expect(localAdapterTestingHelpers.fileNameWithoutExtension("/path/to/config")).toBe("config");
    });

    test("normalizeBasePath handles edge cases", () => {
      expect(localAdapterTestingHelpers.normalizeBasePath("./")).toBe("");
      expect(localAdapterTestingHelpers.normalizeBasePath("./src")).toBe("src");
      expect(localAdapterTestingHelpers.normalizeBasePath("")).toBe("");
      expect(localAdapterTestingHelpers.normalizeBasePath("/")).toBe("");
      expect(localAdapterTestingHelpers.normalizeBasePath("src/config")).toBe("src/config");
    });

    test("isPathInConfigDirectories detects config paths", () => {
      expect(localAdapterTestingHelpers.isPathInConfigDirectories("/src/config/app.ts", "./")).toBe(true);
      expect(localAdapterTestingHelpers.isPathInConfigDirectories("/workspace/src/config/app.ts", "/workspace")).toBe(true);
      expect(localAdapterTestingHelpers.isPathInConfigDirectories("./src/config/app.ts", "./")).toBe(true);
      expect(localAdapterTestingHelpers.isPathInConfigDirectories("/tmp/elsewhere/conf/app.ts", "./")).toBe(false);
    });
  });
});
