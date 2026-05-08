import { describe, expect, test } from "bun:test";
import ConfigRepository from "@/config/repository";
import CacheManager from "@/cache/manager";
import { Cache } from "@/cache/cache";
import MemoryStorageAdapter from "@/storage/adapters/memory";

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

describe("Cache", () => {
  test("returns value before TTL expires", async () => {
    const adapter = new Cache(new MemoryStorageAdapter());
    await adapter.set("k", "v", 60);
    expect(await adapter.get("k")).toBe("v");
    expect(await adapter.has("k")).toBe(true);
  });

  test("returns null after TTL expires", async () => {
    const adapter = new Cache(new MemoryStorageAdapter());
    await adapter.set("k", "v", 0);
    expect(await adapter.get("k")).toBeNull();
    expect(await adapter.has("k")).toBe(false);
  });

  test("TTL = null means no expiry", async () => {
    const adapter = new Cache(new MemoryStorageAdapter());
    await adapter.set("k", "v", null);
    expect(await adapter.get("k")).toBe("v");
  });

  test("no TTL argument means no expiry", async () => {
    const adapter = new Cache(new MemoryStorageAdapter());
    await adapter.set("k", "v");
    expect(await adapter.get("k")).toBe("v");
  });

  test("keys() excludes expired entries without deleting them", async () => {
    const backing = new MemoryStorageAdapter();
    const adapter = new Cache(backing);
    await adapter.set("alive", "a", 60);
    await adapter.set("dead", "b", 0);
    await adapter.set("forever", "c");

    expect(await adapter.keys()).toEqual(["alive", "forever"]);
    // Expired entry is still in the backing store (filter only, no delete)
    expect(await backing.keys()).toEqual(["alive", "dead", "forever"]);
  });

  test("delete removes entry", async () => {
    const adapter = new Cache(new MemoryStorageAdapter());
    await adapter.set("k", "v");
    await adapter.delete("k");
    expect(await adapter.get("k")).toBeNull();
  });

  test("clear removes all entries", async () => {
    const adapter = new Cache(new MemoryStorageAdapter());
    await adapter.set("a", 1);
    await adapter.set("b", 2, 60);
    await adapter.clear();
    expect(await adapter.keys()).toEqual([]);
  });

  test("CacheManager.set passes TTL through", async () => {
    const manager = CacheManager.fromConfig(new ConfigRepository({}));
    await manager.set("live", "yes", 60);
    await manager.set("dead", "no", 0);
    expect(await manager.get("live")).toBe("yes");
    expect(await manager.get("dead")).toBeNull();
  });
});
