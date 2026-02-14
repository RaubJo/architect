import { describe, expect, test } from "bun:test";
import ConfigRepository from "@/config/repository";

describe("ConfigRepository", () => {
  test("gets nested values by dot key", () => {
    const repository = new ConfigRepository({
      app: {
        name: "IOC Application",
        timezone: "UTC",
      },
    });

    expect(repository.get("app.name")).toBe("IOC Application");
    expect(repository.get("app.timezone")).toBe("UTC");
  });

  test("supports defaults and lazy default callbacks", () => {
    const repository = new ConfigRepository({});

    expect(repository.get("app.locale", "en")).toBe("en");
    expect(repository.get("app.name", () => "fallback")).toBe("fallback");
  });

  test("supports set, prepend, and push", () => {
    const repository = new ConfigRepository({
      app: {
        middlewares: ["auth"],
      },
    });

    repository.prepend("app.middlewares", "throttle");
    repository.push("app.middlewares", "verified");
    repository.set("app.name", "IOC");

    expect(repository.get("app.name")).toBe("IOC");
    expect(repository.array("app.middlewares")).toEqual([
      "throttle",
      "auth",
      "verified",
    ]);
  });

  test("supports getMany with list and defaults map", () => {
    const repository = new ConfigRepository({
      app: { name: "IOC Application" },
    });

    expect(repository.getMany(["app.name", "app.locale"])).toEqual({
      "app.name": "IOC Application",
      "app.locale": null,
    });

    expect(
      repository.getMany({
        "app.name": "fallback",
        "app.locale": "en",
      }),
    ).toEqual({
      "app.name": "IOC Application",
      "app.locale": "en",
    });
  });

  test("typed accessors return expected values", () => {
    const repository = new ConfigRepository({
      app: {
        name: "IOC",
        retries: 3,
        ratio: 0.75,
        enabled: true,
        tags: ["alpha"],
      },
    });

    expect(repository.string("app.name")).toBe("IOC");
    expect(repository.integer("app.retries")).toBe(3);
    expect(repository.float("app.ratio")).toBe(0.75);
    expect(repository.boolean("app.enabled")).toBe(true);
    expect(repository.array("app.tags")).toEqual(["alpha"]);
  });

  test("typed accessors throw when type does not match", () => {
    const repository = new ConfigRepository({
      app: {
        name: 123,
        retries: "3",
        ratio: "0.75",
        enabled: "yes",
        tags: "nope",
      },
    });

    expect(() => repository.string("app.name")).toThrow(
      "Configuration value [app.name] is not a string.",
    );
    expect(() => repository.integer("app.retries")).toThrow(
      "Configuration value [app.retries] is not an integer.",
    );
    expect(() => repository.float("app.ratio")).toThrow(
      "Configuration value [app.ratio] is not a float.",
    );
    expect(() => repository.boolean("app.enabled")).toThrow(
      "Configuration value [app.enabled] is not a boolean.",
    );
    expect(() => repository.array("app.tags")).toThrow(
      "Configuration value [app.tags] is not an array.",
    );
  });

  test("supports offset-style helpers", () => {
    const repository = new ConfigRepository({
      app: { name: "IOC Application" },
    });

    expect(repository.offsetExists("app.name")).toBe(true);
    expect(repository.offsetGet("app.name")).toBe("IOC Application");

    repository.offsetSet("app.name", "Changed");
    expect(repository.offsetGet("app.name")).toBe("Changed");

    repository.offsetUnset("app.name");
    expect(repository.offsetExists("app.name")).toBe(false);
  });
});
