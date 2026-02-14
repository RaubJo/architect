import { afterEach, describe, expect, test } from "bun:test";
import type { ContainerContract } from "@/container/contract";
import InversifyContainer from "@/container/adapters/inversify";
import { Application } from "@/foundation/application";
import StorageManager from "@/storage/manager";
import MemoryStorageAdapter from "@/storage/adapters/memory";
import Storage from "@/support/facades/storage";
import Facade from "@/support/facades/facade";

describe("Storage facade", () => {
  afterEach(() => {
    Facade.clearResolvedInstances();
    (Application as unknown as { container: ContainerContract | null }).container = null;
  });

  test("resolves manager and delegates methods", async () => {
    const container = new InversifyContainer();
    const manager = new StorageManager({ memory: new MemoryStorageAdapter() }, "memory");
    container.bind("storage").toConstantValue(manager);
    container.bind(StorageManager).toConstantValue(manager);
    (Application as unknown as { container: ContainerContract | null }).container = container;

    await Storage.set("name", "ioc");
    expect(await Storage.get("name")).toBe("ioc");
    expect(await Storage.has("name")).toBe(true);
    expect(await Storage.keys()).toEqual(["name"]);
    expect(Storage.drv()).toBe(manager.drv());
    expect(Storage.drv("memory")).toBe(manager.drv("memory"));
    Storage.use("memory");
    await Storage.delete("name");
    expect(await Storage.get("name")).toBeNull();
    await Storage.set("x", 1);
    await Storage.clear();
    expect(await Storage.keys()).toEqual([]);
  });

  test("uses expected facade accessor", () => {
    expect((Storage as unknown as { getFacadeAccessor: () => string }).getFacadeAccessor()).toBe(
      "storage",
    );
  });

  test("facade class constructor is defined", () => {
    const instance = new (Storage as unknown as { new (): object })();
    expect(instance).toBeTruthy();
  });
});
