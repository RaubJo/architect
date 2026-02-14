import { describe, expect, test } from "bun:test";
import ConfigRepository from "@/config/repository";
import IndexedDbAdapter from "@/storage/adapters/indexed-db";
import LocalStorageAdapter from "@/storage/adapters/local-storage";
import MemoryStorageAdapter from "@/storage/adapters/memory";
import StorageManager from "@/storage/manager";

class FakeWebStorage implements Storage {
  protected data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.data.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

type RequestLike<T> = Partial<IDBRequest<T>> & {
  onsuccess: ((this: IDBRequest<T>, ev: Event) => unknown) | null;
  onerror: ((this: IDBRequest<T>, ev: Event) => unknown) | null;
  onupgradeneeded?: ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => unknown) | null;
};

function makeRequest<T>(resolveValue: () => T, shouldFail = false): IDBRequest<T> {
  const request: RequestLike<T> = {
    onsuccess: null,
    onerror: null,
  };

  queueMicrotask(() => {
    if (shouldFail) {
      request.error = new Error("fail") as unknown as DOMException;
      request.onerror?.call(request as IDBRequest<T>, new Event("error"));
      return;
    }

    request.result = resolveValue();
    request.onsuccess?.call(request as IDBRequest<T>, new Event("success"));
  });

  return request as IDBRequest<T>;
}

function createIndexedDbFactory(options: { failOpen?: boolean; failGet?: boolean } = {}) {
  const items = new Map<string, unknown>();
  let hasStore = false;

  const store: Partial<IDBObjectStore> = {
    get: (key: IDBValidKey) => makeRequest(() => items.get(String(key)), options.failGet),
    put: (value: unknown, key?: IDBValidKey) =>
      makeRequest(() => {
        items.set(String(key), value);
        return key as IDBValidKey;
      }),
    count: (key?: IDBValidKey | IDBKeyRange) =>
      makeRequest(() => (items.has(String(key)) ? 1 : 0)),
    delete: (key: IDBValidKey | IDBKeyRange) =>
      makeRequest(() => {
        items.delete(String(key));
        return undefined;
      }),
    clear: () =>
      makeRequest(() => {
        items.clear();
        return undefined;
      }),
    getAllKeys: () => makeRequest(() => Array.from(items.keys()) as Array<IDBValidKey>),
  };

  const db: Partial<IDBDatabase> = {
    objectStoreNames: {
      contains: (name: string) => hasStore && name === "kv",
      item: () => null,
      length: 0,
      [Symbol.iterator]: function* iterator() {},
    } as DOMStringList,
    createObjectStore: () => {
      hasStore = true;
      return store as IDBObjectStore;
    },
    transaction: () =>
      ({
        objectStore: () => store as IDBObjectStore,
      }) as IDBTransaction,
  };

  const factory: Pick<IDBFactory, "open"> = {
    open: () => {
      const request: RequestLike<IDBDatabase> = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };

      queueMicrotask(() => {
        if (options.failOpen) {
          request.error = new Error("open failed") as unknown as DOMException;
          request.onerror?.call(request as IDBOpenDBRequest, new Event("error"));
          return;
        }

        request.result = db as IDBDatabase;
        request.onupgradeneeded?.call(
          request as IDBOpenDBRequest,
          new Event("upgradeneeded") as IDBVersionChangeEvent,
        );
        request.onsuccess?.call(request as IDBOpenDBRequest, new Event("success"));
      });

      return request as IDBOpenDBRequest;
    },
  };

  return { factory, items };
}

describe("Storage adapters and manager", () => {
  test("memory adapter reads/writes/deletes/clears", async () => {
    const adapter = new MemoryStorageAdapter();

    await adapter.set("a", 1);
    expect(await adapter.get<number>("a")).toBe(1);
    expect(await adapter.has("a")).toBe(true);
    expect(await adapter.keys()).toEqual(["a"]);
    await adapter.delete("a");
    expect(await adapter.get("a")).toBeNull();
    await adapter.set("b", 2);
    await adapter.clear();
    expect(await adapter.keys()).toEqual([]);
  });

  test("local storage adapter serializes values", async () => {
    const storage = new FakeWebStorage();
    const adapter = new LocalStorageAdapter(storage);

    await adapter.set("name", { v: "ioc" });
    expect(await adapter.get<{ v: string }>("name")).toEqual({ v: "ioc" });
    expect(await adapter.has("name")).toBe(true);
    expect(await adapter.keys()).toEqual(["name"]);
    await adapter.delete("name");
    expect(await adapter.get("name")).toBeNull();
    await adapter.set("x", 1);
    await adapter.clear();
    expect(await adapter.keys()).toEqual([]);
  });

  test("indexed db adapter uses indexeddb when available", async () => {
    const { factory, items } = createIndexedDbFactory();
    const adapter = new IndexedDbAdapter({ factory, name: "ioc-test" });

    await adapter.set("k", { n: 1 });
    expect(items.get("k")).toEqual({ n: 1 });
    expect(await adapter.get<{ n: number }>("k")).toEqual({ n: 1 });
    expect(await adapter.has("k")).toBe(true);
    expect(await adapter.keys()).toEqual(["k"]);
    await adapter.delete("k");
    expect(await adapter.get("k")).toBeNull();
    await adapter.set("z", true);
    await adapter.clear();
    expect(await adapter.keys()).toEqual([]);
  });

  test("indexed db adapter falls back to memory when indexeddb is unavailable or fails", async () => {
    const fallback = new MemoryStorageAdapter();
    const unavailable = new IndexedDbAdapter({ factory: null, fallback });

    await unavailable.set("a", 1);
    expect(await unavailable.get<number>("a")).toBe(1);
    expect(await unavailable.has("a")).toBe(true);
    expect(await unavailable.keys()).toEqual(["a"]);
    await unavailable.delete("a");
    expect(await unavailable.has("a")).toBe(false);
    await unavailable.set("b", 2);
    await unavailable.clear();
    expect(await unavailable.keys()).toEqual([]);

    const failedOpenFactory: Pick<IDBFactory, "open"> = {
      open: () => null as unknown as IDBOpenDBRequest,
    };
    const failedOpen = new IndexedDbAdapter({ factory: failedOpenFactory, fallback });
    await failedOpen.set("x", 42);
    expect(await failedOpen.get<number>("x")).toBe(42);

    const { factory: failOpenFactory } = createIndexedDbFactory({ failOpen: true });
    const failedOpenEvent = new IndexedDbAdapter({ factory: failOpenFactory, fallback });
    expect(await failedOpenEvent.get("none")).toBeNull();

    const { factory: failGetFactory } = createIndexedDbFactory({ failGet: true });
    const failedGet = new IndexedDbAdapter({ factory: failGetFactory, fallback });
    await failedGet.set("y", 7);
    expect(await failedGet.get<number>("y")).toBeNull();

    const rejectingFallback = {
      get: async () => null,
      set: async () => {
        throw new Error("set failed");
      },
      has: async () => false,
      delete: async () => {},
      clear: async () => {},
      keys: async () => [],
    };
    const rejected = new IndexedDbAdapter({ factory: null, fallback: rejectingFallback });
    await expect(rejected.set("bad", 1)).rejects.toThrow("set failed");
  });

  test("storage manager chooses and switches drivers", async () => {
    const memory = new MemoryStorageAdapter();
    const alt = new MemoryStorageAdapter();
    const manager = new StorageManager({ memory, alt }, "memory");

    await manager.set("k", 1);
    expect(await manager.get("k")).toBe(1);
    manager.use("alt");
    expect(manager.drv()).toBe(alt);
    expect(() => manager.drv("missing")).toThrow("Storage driver [missing] is not defined.");
  });

  test("storage manager builds defaults from config", () => {
    const originalWindow = (globalThis as { window?: unknown }).window;
    const originalIndexedDb = (globalThis as { indexedDB?: unknown }).indexedDB;

    try {
      (globalThis as { window?: unknown }).window = {
        localStorage: new FakeWebStorage(),
      };
      (globalThis as { indexedDB?: unknown }).indexedDB = createIndexedDbFactory().factory;

      const manager = StorageManager.fromConfig(
        new ConfigRepository({
          storage: {
            driver: "local",
          },
        }),
      );

      expect(manager.drv()).toBeTruthy();
      expect(manager.drv("indexed")).toBeTruthy();
      expect(manager.drv("memory")).toBeTruthy();
    } finally {
      (globalThis as { window?: unknown }).window = originalWindow;
      (globalThis as { indexedDB?: unknown }).indexedDB = originalIndexedDb;
    }
  });
});
