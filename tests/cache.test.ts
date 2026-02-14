import { describe, expect, test } from "bun:test";
import ConfigRepository from "@/config/repository";
import CacheManager from "@/cache/manager";

describe("CacheManager", () => {
  test("uses cache.default and configured stores", async () => {
    const manager = CacheManager.fromConfig(
      new ConfigRepository({
        cache: {
          default: "persistent",
          stores: {
            persistent: { driver: "memory" },
            fast: { driver: "memory" },
          },
        },
      }),
    );

    await manager.set("key", "value");
    expect(await manager.get("key")).toBe("value");
    expect(await manager.has("key")).toBe(true);
    expect(await manager.keys()).toEqual(["key"]);
    await manager.delete("key");
    expect(await manager.get("key")).toBeNull();
    await manager.set("other", 1);
    await manager.clear();
    expect(await manager.keys()).toEqual([]);

    manager.use("fast");
    await manager.set("fast-key", 123);
    expect(await manager.get("fast-key")).toBe(123);
  });

  test("falls back to default stores and memory default", async () => {
    const manager = CacheManager.fromConfig(new ConfigRepository({}));
    await manager.set("a", 1);
    expect(await manager.get("a")).toBe(1);
    expect(manager.store("memory")).toBeTruthy();
  });

  test("resolves missing driver/store behavior", () => {
    const manager = CacheManager.fromConfig(
      new ConfigRepository({
        cache: {
          default: "missing",
          stores: {
            only: { driver: "unknown" },
          },
        },
      }),
    );

    expect(manager.store()).toBeTruthy();
    expect(() => manager.store("nope")).toThrow("Cache store [nope] is not defined.");
  });

  test("handles non-object cache.stores by using defaults", () => {
    const manager = CacheManager.fromConfig(
      new ConfigRepository({
        cache: {
          stores: "bad-value",
        },
      }),
    );

    expect(manager.store("memory")).toBeTruthy();
  });
});
