import { describe, it, expect } from "bun:test";
import { createConfig } from "../../src/config/discovery";
import type { ConfigLoader } from "../../src/config/discovery";
import { EsmConfigLoader } from "../../src/config/discovery";
import { ConfigFactory } from "../../src/config/discovery";
import { ConfigRepository } from "../../src/config/repository";

describe("Config Discovery", () => {
  it("should create configuration repository", () => {
    const config = createConfig("./", { app: { name: "TestApp" } });
    expect(config).toBeInstanceOf(ConfigRepository);
    expect(config.get("app.name")).toBe("TestApp");
  });

  it("should handle static config items", () => {
    const config = createConfig("./", { test: "value" });
    expect(config.get("test")).toBe("value");
  });

  it("should support an explicit config loader", () => {
    const loader: ConfigLoader = {
      load(basePath, staticItems = {}) {
        return {
          ...staticItems,
          loader: { basePath },
        };
      },
    };

    const config = ConfigFactory.create("/app", { app: { name: "TestApp" } }, loader);

    expect(config).toBeInstanceOf(ConfigRepository);
    expect(config.get("app.name")).toBe("TestApp");
    expect(config.get("loader.basePath")).toBe("/app");
  });

  it("should allow direct loader usage", () => {
    const loader = new EsmConfigLoader();

    expect(loader.load("./", { direct: true })).toEqual({ direct: true });
  });

  it("cloneItems falls back to JSON when structuredClone is unavailable", () => {
    const orig = (globalThis as { structuredClone?: unknown }).structuredClone;
    (globalThis as { structuredClone?: unknown }).structuredClone = undefined;
    try {
      const config = createConfig("./", { fallback: { works: true } });
      expect(config.get("fallback.works")).toBe(true);
    } finally {
      (globalThis as { structuredClone?: unknown }).structuredClone = orig;
    }
  });

  it("configPatternForBasePath works without trailing slash", () => {
    let capturedPattern: string | undefined;
    const origGlob = (globalThis as { __iocConfigGlobForTests?: unknown }).__iocConfigGlobForTests;
    (globalThis as { __iocConfigGlobForTests?: unknown }).__iocConfigGlobForTests = (pattern: string) => {
      capturedPattern = pattern;
      return {};
    };
    try {
      const loader = new EsmConfigLoader();
      loader.load("/app");
      expect(capturedPattern).toBe("/app/config/**/*.ts");
    } finally {
      (globalThis as { __iocConfigGlobForTests?: unknown }).__iocConfigGlobForTests = origGlob;
    }
  });
});
