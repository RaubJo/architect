import { describe, expect, test } from "bun:test"
import ConfigRepository from "@/config/repository"
import BuiltinContainer from "@/container/adapters/builtin"
import IndexedDbAdapter from "@/store/adapters/indexed-db"
import LocalStorageAdapter from "@/store/adapters/local-storage"
import MemoryStoreAdapter from "@/store/adapters/memory"
import StoreManager from "@/store/manager"
import { StoreProvider } from "@/store/provider"

class FakeWebStorage implements Storage {
    protected data = new Map<string, string>()

    get length(): number {
        return this.data.size
    }

    clear(): void {
        this.data.clear()
    }

    getItem(key: string): string | null {
        return this.data.get(key) ?? null
    }

    key(index: number): string | null {
        const keys = Array.from(this.data.keys())
        return keys[index] ?? null
    }

    removeItem(key: string): void {
        this.data.delete(key)
    }

    setItem(key: string, value: string): void {
        this.data.set(key, value)
    }
}

type RequestLike<T> = Partial<IDBRequest<T>> & {
    onsuccess: ((this: IDBRequest<T>, ev: Event) => unknown) | null
    onerror: ((this: IDBRequest<T>, ev: Event) => unknown) | null
    onupgradeneeded?: ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => unknown) | null
}

function makeRequest<T>(resolveValue: () => T, shouldFail = false): IDBRequest<T> {
    const request: RequestLike<T> = {
        onsuccess: null,
        onerror: null,
    }

    queueMicrotask(() => {
        if (shouldFail) {
            ;(request as { error: DOMException | null }).error = new Error("fail") as unknown as DOMException
            request.onerror?.call(request as IDBRequest<T>, new Event("error"))
            return
        }

        ;(request as { result: T }).result = resolveValue()
        request.onsuccess?.call(request as IDBRequest<T>, new Event("success"))
    })

    return request as IDBRequest<T>
}

function createIndexedDbFactory(options: { failOpen?: boolean; failGet?: boolean } = {}) {
    const items = new Map<string, unknown>()
    let hasStore = false

    const store: Partial<IDBObjectStore> = {
        get: (key: IDBValidKey) => makeRequest(() => items.get(String(key)), options.failGet),
        put: (value: unknown, key?: IDBValidKey) =>
            makeRequest(() => {
                items.set(String(key), value)
                return key as IDBValidKey
            }),
        count: (key?: IDBValidKey | IDBKeyRange) => makeRequest<number>(() => (items.has(String(key)) ? 1 : 0)),
        delete: (key: IDBValidKey | IDBKeyRange) =>
            makeRequest(() => {
                items.delete(String(key))
                return undefined
            }),
        clear: () =>
            makeRequest(() => {
                items.clear()
                return undefined
            }),
        getAllKeys: () => makeRequest(() => Array.from(items.keys()) as Array<IDBValidKey>),
    }

    const db: Partial<IDBDatabase> = {
        objectStoreNames: {
            contains: (name: string) => hasStore && name === "kv",
            item: () => null,
            length: 0,
            [Symbol.iterator]: function* iterator() {},
        } as DOMStringList,
        createObjectStore: () => {
            hasStore = true
            return store as IDBObjectStore
        },
        transaction: () =>
            ({
                objectStore: () => store as IDBObjectStore,
            }) as unknown as IDBTransaction,
    }

    const factory: Pick<IDBFactory, "open"> = {
        open: () => {
            const request: RequestLike<IDBDatabase> = {
                onsuccess: null,
                onerror: null,
                onupgradeneeded: null,
            }

            queueMicrotask(() => {
                if (options.failOpen) {
                    ;(request as { error: DOMException | null }).error = new Error(
                        "open failed",
                    ) as unknown as DOMException
                    request.onerror?.call(request as IDBOpenDBRequest, new Event("error"))
                    return
                }

                ;(request as { result: IDBDatabase }).result = db as IDBDatabase
                request.onupgradeneeded?.call(
                    request as IDBOpenDBRequest,
                    new Event("upgradeneeded") as IDBVersionChangeEvent,
                )
                request.onsuccess?.call(request as IDBOpenDBRequest, new Event("success"))
            })

            return request as IDBOpenDBRequest
        },
    }

    return { factory, items }
}

describe("Store adapters and manager", () => {
    test("memory adapter reads/writes/deletes/clears", async () => {
        const adapter = new MemoryStoreAdapter()

        await adapter.set("a", 1)
        expect(await adapter.get<number>("a")).toBe(1)
        expect(await adapter.has("a")).toBe(true)
        expect(await adapter.keys()).toEqual(["a"])
        await adapter.delete("a")
        expect(await adapter.get("a")).toBeNull()
        await adapter.set("b", 2)
        await adapter.clear()
        expect(await adapter.keys()).toEqual([])
    })

    test("local storage adapter serializes values", async () => {
        const storage = new FakeWebStorage()
        const adapter = new LocalStorageAdapter(storage)

        await adapter.set("name", { v: "ioc" })
        expect(await adapter.get<{ v: string }>("name")).toEqual({ v: "ioc" })
        expect(await adapter.has("name")).toBe(true)
        expect(await adapter.keys()).toEqual(["name"])
        await adapter.delete("name")
        expect(await adapter.get("name")).toBeNull()
        await adapter.set("x", 1)
        await adapter.clear()
        expect(await adapter.keys()).toEqual([])
    })

    test("indexed db adapter uses indexeddb when available", async () => {
        const { factory, items } = createIndexedDbFactory()
        const adapter = new IndexedDbAdapter({ factory, name: "ioc-test" })

        await adapter.set("k", { n: 1 })
        expect(items.get("k")).toEqual({ n: 1 })
        expect(await adapter.get<{ n: number }>("k")).toEqual({ n: 1 })
        expect(await adapter.has("k")).toBe(true)
        expect(await adapter.keys()).toEqual(["k"])
        await adapter.delete("k")
        expect(await adapter.get("k")).toBeNull()
        await adapter.set("z", true)
        await adapter.clear()
        expect(await adapter.keys()).toEqual([])
    })

    test("indexed db adapter falls back to memory when indexeddb is unavailable or fails", async () => {
        const fallback = new MemoryStoreAdapter()
        const unavailable = new IndexedDbAdapter({ factory: null, fallback })

        await unavailable.set("a", 1)
        expect(await unavailable.get<number>("a")).toBe(1)
        expect(await unavailable.has("a")).toBe(true)
        expect(await unavailable.keys()).toEqual(["a"])
        await unavailable.delete("a")
        expect(await unavailable.has("a")).toBe(false)
        await unavailable.set("b", 2)
        await unavailable.clear()
        expect(await unavailable.keys()).toEqual([])

        const failedOpenFactory: Pick<IDBFactory, "open"> = {
            open: () => null as unknown as IDBOpenDBRequest,
        }
        const failedOpen = new IndexedDbAdapter({ factory: failedOpenFactory, fallback })
        await failedOpen.set("x", 42)
        expect(await failedOpen.get<number>("x")).toBe(42)

        const { factory: failOpenFactory } = createIndexedDbFactory({ failOpen: true })
        const failedOpenEvent = new IndexedDbAdapter({ factory: failOpenFactory, fallback })
        expect(await failedOpenEvent.get("none")).toBeNull()

        const { factory: failGetFactory } = createIndexedDbFactory({ failGet: true })
        const failedGet = new IndexedDbAdapter({ factory: failGetFactory, fallback })
        await failedGet.set("y", 7)
        expect(await failedGet.get<number>("y")).toBeNull()

        const rejectingFallback = {
            get: async () => null,
            set: async () => {
                throw new Error("set failed")
            },
            has: async () => false,
            delete: async () => {},
            clear: async () => {},
            keys: async () => [],
        }
        const rejected = new IndexedDbAdapter({ factory: null, fallback: rejectingFallback })
        await expect(rejected.set("bad", 1)).rejects.toThrow("set failed")
    })

    test("indexed db adapter retries opening after a transient failure", async () => {
        const fallback = new MemoryStoreAdapter()
        const { factory: workingFactory, items } = createIndexedDbFactory()
        let attempts = 0

        const flakyFactory: Pick<IDBFactory, "open"> = {
            open: () => {
                attempts += 1

                if (attempts === 1) {
                    return null as unknown as IDBOpenDBRequest
                }

                return workingFactory.open("db")
            },
        }

        const adapter = new IndexedDbAdapter({ factory: flakyFactory, fallback })

        await adapter.set("fallback-key", 1)
        expect(await fallback.get<number>("fallback-key")).toBe(1)

        await adapter.set("indexed-key", 2)
        expect(items.get("indexed-key")).toBe(2)
        expect(await adapter.get<number>("indexed-key")).toBe(2)
    })

    test("store manager chooses and switches drivers", async () => {
        const memory = new MemoryStoreAdapter()
        const alt = new MemoryStoreAdapter()
        const manager = new StoreManager({ memory, alt }, "memory")

        await manager.set("k", 1)
        expect(await manager.get("k")).toBe(1)
        manager.use("alt")
        expect(manager.driver()).toBe(alt)
        expect(() => manager.driver("missing")).toThrow("Store driver [missing] is not defined.")
    })

    test("store manager extend() registers a custom driver lazily", async () => {
        const manager = new StoreManager({ memory: new MemoryStoreAdapter() })
        let factoryCalled = 0

        manager.extend("custom", (_config) => {
            factoryCalled++
            return new MemoryStoreAdapter()
        })

        // Factory not called yet
        expect(factoryCalled).toBe(0)

        manager.use("custom")
        await manager.set("k", "v")
        expect(await manager.get("k")).toBe("v")

        // Factory called exactly once and result cached
        expect(factoryCalled).toBe(1)
        manager.use("custom")
        expect(factoryCalled).toBe(1)
    })

    test("store manager builds defaults from config", () => {
        const originalWindow = (globalThis as { window?: unknown }).window
        const originalIndexedDb = (globalThis as { indexedDB?: unknown }).indexedDB

        try {
            ;(globalThis as { window?: unknown }).window = {
                localStorage: new FakeWebStorage(),
            }
            ;(globalThis as { indexedDB?: unknown }).indexedDB = createIndexedDbFactory().factory

            const manager = StoreManager.fromConfig(
                new ConfigRepository({
                    store: {
                        driver: "local",
                    },
                }),
            )

            expect(manager.driver()).toBeTruthy()
            expect(manager.driver("indexed")).toBeTruthy()
            expect(manager.driver("memory")).toBeTruthy()
        } finally {
            ;(globalThis as { window?: unknown }).window = originalWindow
            ;(globalThis as { indexedDB?: unknown }).indexedDB = originalIndexedDb
        }
    })
})

describe("StoreProvider", () => {
    test("register binds StoreManager as singleton under 'store'", () => {
        const container = new BuiltinContainer()
        container.instance("config", new ConfigRepository({}))
        new StoreProvider().register(container)
        const s1 = container.make<StoreManager>("store")
        const s2 = container.make<StoreManager>("store")
        expect(s1).toBeInstanceOf(StoreManager)
        expect(s1).toBe(s2)
    })
})
