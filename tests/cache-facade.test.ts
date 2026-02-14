import { afterEach, describe, expect, test } from "bun:test";
import type { ContainerContract } from "@/container/contract";
import InversifyContainer from "@/container/adapters/inversify";
import { Application } from "@/foundation/application";
import CacheManager from "@/cache/manager";
import Cache from "@/support/facades/cache";
import Facade from "@/support/facades/facade";
import MemoryStorageAdapter from "@/storage/adapters/memory";

describe("Cache facade", () => {
  afterEach(() => {
    Facade.clearResolvedInstances();
    (Application as unknown as { container: ContainerContract | null }).container = null;
  });

  test("resolves manager and delegates methods", async () => {
    const manager = new CacheManager({ memory: new MemoryStorageAdapter() }, "memory");
    const container = new InversifyContainer();
    container.bind("cache").toConstantValue(manager);
    container.bind(CacheManager).toConstantValue(manager);
    (Application as unknown as { container: ContainerContract | null }).container = container;

    await Cache.set("name", "ioc");
    expect(await Cache.get("name")).toBe("ioc");
    expect(await Cache.has("name")).toBe(true);
    expect(await Cache.keys()).toEqual(["name"]);
    expect(Cache.store()).toBe(manager.store());
    Cache.use("memory");
    await Cache.delete("name");
    expect(await Cache.get("name")).toBeNull();
    await Cache.set("x", 1);
    await Cache.clear();
    expect(await Cache.keys()).toEqual([]);
  });

  test("uses expected facade accessor", () => {
    expect((Cache as unknown as { getFacadeAccessor: () => string }).getFacadeAccessor()).toBe(
      "cache",
    );
  });

  test("facade class constructor is defined", () => {
    const instance = new (Cache as unknown as { new (): object })();
    expect(instance).toBeTruthy();
  });
});
