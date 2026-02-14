import { afterEach, describe, expect, test } from "bun:test";
import type { ContainerContract } from "@/container/contract";
import InversifyContainer from "@/container/adapters/inversify";
import ConfigRepository from "@/config/repository";
import { Application } from "@/foundation/application";
import Config from "@/support/facades/config";
import Facade from "@/support/facades/facade";

describe("Config facade", () => {
  afterEach(() => {
    Facade.clearResolvedInstances();
    (Application as unknown as { container: ContainerContract | null }).container = null;
  });

  test("resolves repository from the container using the config accessor", () => {
    const container = new InversifyContainer();
    const repository = new ConfigRepository({
      app: {
        name: "From Provider",
      },
    });
    container.bind("config").toConstantValue(repository);
    container.bind(ConfigRepository).toConstantValue(repository);

    (Application as unknown as { container: ContainerContract | null }).container = container;

    expect(Config.get("app.name")).toBe("From Provider");
    expect(container.get(ConfigRepository).get("app.name")).toBe("From Provider");
  });

  test("uses expected facade accessor name", () => {
    expect((Config as unknown as { getFacadeAccessor: () => string }).getFacadeAccessor()).toBe(
      "config",
    );
  });

  test("facade class constructor is defined", () => {
    const instance = new (Config as unknown as { new (): object })();
    expect(instance).toBeTruthy();
  });

  test("uses facade cache until resolved instances are cleared", () => {
    const container = new InversifyContainer();
    container
      .bind("config")
      .toConstantValue(new ConfigRepository({ app: { name: "First" } }));
    container
      .bind(ConfigRepository)
      .toConstantValue(new ConfigRepository({ app: { name: "First" } }));
    (Application as unknown as { container: ContainerContract | null }).container = container;

    expect(Config.get("app.name")).toBe("First");

    // Rebind underlying container value; facade should still return cached first instance.
    container.unbind("config");
    container.bind("config").toConstantValue(new ConfigRepository({ app: { name: "Second" } }));
    expect(Config.get("app.name")).toBe("First");

    Facade.clearResolvedInstances();
    expect(Config.get("app.name")).toBe("Second");
  });

  test("delegates full method surface to repository", () => {
    const container = new InversifyContainer();
    const repository = new ConfigRepository({
      app: {
        name: "IOC",
        retries: 3,
        ratio: 1.5,
        enabled: true,
        tags: ["base"],
      },
    });
    container.bind("config").toConstantValue(repository);
    container.bind(ConfigRepository).toConstantValue(repository);
    (Application as unknown as { container: ContainerContract | null }).container = container;

    expect(Config.has("app.name")).toBe(true);
    expect(Config.getMany(["app.name"])).toEqual({ "app.name": "IOC" });
    expect(Config.string("app.name")).toBe("IOC");
    expect(Config.integer("app.retries")).toBe(3);
    expect(Config.float("app.ratio")).toBe(1.5);
    expect(Config.boolean("app.enabled")).toBe(true);
    expect(Config.array("app.tags")).toEqual(["base"]);

    Config.set("app.name", "Changed");
    Config.prepend("app.tags", "first");
    Config.push("app.tags", "last");

    expect(Config.get("app.name")).toBe("Changed");
    expect(Config.array("app.tags")).toEqual(["first", "base", "last"]);
    expect(Config.all()).toMatchObject({
      app: {
        name: "Changed",
      },
    });
  });
});
