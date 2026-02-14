import { afterEach, describe, expect, test } from "bun:test";
import { FileSystem } from "@/filesystem/filesystem";
import LocalAdapter from "@/filesystem/adapters/local";
import { localAdapterTestingHelpers } from "@/filesystem/adapters/local_test.helpers";

describe("FileSystem domain", () => {
  afterEach(() => {
    (
      globalThis as {
        __iocConfigModules?: unknown;
      }
    ).__iocConfigModules = undefined;
    (
      globalThis as {
        __iocConfigGlob?: unknown;
      }
    ).__iocConfigGlob = undefined;
    (
      globalThis as {
        __iocConfigGlobForTests?: unknown;
      }
    ).__iocConfigGlobForTests = undefined;
  });

  test("delegates loading to adapter and supports replacing adapter", () => {
    const calls: string[] = [];
    const adapterA = {
      loadConfigItems: (basePath: string) => {
        calls.push(`a:${basePath}`);
        return { app: { name: "A" } };
      },
    };
    const adapterB = {
      loadConfigItems: (basePath: string) => {
        calls.push(`b:${basePath}`);
        return { app: { name: "B" } };
      },
    };

    const filesystem = new FileSystem(adapterA);
    expect(filesystem.loadConfigItems("./")).toEqual({ app: { name: "A" } });

    filesystem.setAdapter(adapterB);
    expect(filesystem.loadConfigItems("./src")).toEqual({ app: { name: "B" } });
    expect(calls).toEqual(["a:./", "b:./src"]);
  });

  test("loads config defaults from matching directories", () => {
    (
      globalThis as {
        __iocConfigGlobForTests?: (
          pattern: string | string[],
          options?: { eager?: boolean },
        ) => Record<string, unknown>;
      }
    ).__iocConfigGlobForTests = () => ({
      "/src/config/app.ts": { default: { name: "App" } },
      "/src/config/cache.ts": { default: { driver: "memory" } },
      "/src/config/no-default.ts": { named: true },
      "/ignored/config/app.ts": { default: { name: "Ignored" } },
    });

    const adapter = new LocalAdapter();

    expect(adapter.loadConfigItems("./src")).toEqual({
      app: { name: "App" },
      cache: { driver: "memory" },
    });
  });

  test("loads config defaults when glob returns relative src paths", () => {
    (
      globalThis as {
        __iocConfigGlobForTests?: (
          pattern: string | string[],
          options?: { eager?: boolean },
        ) => Record<string, unknown>;
      }
    ).__iocConfigGlobForTests = () => ({
      "./src/config/app.ts": { default: { name: "Relative App" } },
      "./src/config/cache.ts": { default: { driver: "memory" } },
      "./src/config/no-default.ts": { named: true },
    });

    const adapter = new LocalAdapter();

    expect(adapter.loadConfigItems("./")).toEqual({
      app: { name: "Relative App" },
      cache: { driver: "memory" },
    });
  });

  test("helper functions normalize and match config paths", () => {
    expect(localAdapterTestingHelpers.fileNameWithoutExtension("/src/config/app.ts")).toBe("app");
    expect(localAdapterTestingHelpers.normalizeBasePath("./")).toBe("");
    expect(localAdapterTestingHelpers.normalizeBasePath("./src")).toBe("src");
    expect(localAdapterTestingHelpers.isPathInConfigDirectories("/src/config/app.ts", "./")).toBe(
      true,
    );
    expect(
      localAdapterTestingHelpers.isPathInConfigDirectories(
        "/workspace/src/config/app.ts",
        "/workspace",
      ),
    ).toBe(true);
    expect(localAdapterTestingHelpers.isPathInConfigDirectories("./src/config/app.ts", "./")).toBe(
      true,
    );
    expect(localAdapterTestingHelpers.isPathInConfigDirectories("/tmp/elsewhere/conf/app.ts", "./"))
      .toBe(false);
  });

  test("returns empty config when no glob implementation is available", () => {
    const adapter = new LocalAdapter();
    expect(adapter.loadConfigItems("./")).toEqual({});
  });

  test("uses runtime config glob when import-meta glob is unavailable", () => {
    (
      globalThis as {
        __iocConfigGlob?: (
          pattern: string | string[],
          options?: { eager?: boolean },
        ) => Record<string, unknown>;
      }
    ).__iocConfigGlob = () => ({
      "./src/config/app.ts": { default: { name: "Runtime App" } },
    });

    const adapter = new LocalAdapter();
    expect(adapter.loadConfigItems("./")).toEqual({
      app: { name: "Runtime App" },
    });
  });

  test("uses runtime config modules when provided", () => {
    (
      globalThis as {
        __iocConfigModules?: Record<string, unknown>;
      }
    ).__iocConfigModules = {
      "./src/config/app.ts": { default: { name: "Runtime Modules App" } },
      "./src/config/cache.ts": { default: { driver: "memory" } },
    };

    const adapter = new LocalAdapter();
    expect(adapter.loadConfigItems("./")).toEqual({
      app: { name: "Runtime Modules App" },
      cache: { driver: "memory" },
    });
  });
});
