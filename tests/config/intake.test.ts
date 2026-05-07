import { describe, it, expect } from "bun:test";
import { createConfig } from "../../src/config/intake";
import type { ConfigLoader } from "../../src/config/intake/loader";
import { EsmConfigLoader } from "../../src/config/intake/esm-loader";
import { ConfigFactory } from "../../src/config/intake/factory";
import { ConfigRepository } from "../../src/config/repository";

describe("Config Intake", () => {
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
});
