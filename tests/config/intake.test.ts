import { describe, it, expect } from "bun:test";
import { createConfig } from "../../src/config/intake";
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
});