import type ConfigRepository from "../config/repository"
import Manager from "../support/manager"
import type { Adapter } from "./adapters/contract"
import IndexedDbAdapter from "./adapters/indexed-db"
import LocalStorageAdapter from "./adapters/local-storage"
import MemoryStoreAdapter from "./adapters/memory"

type DriverName = "memory" | "local" | "indexed"

export default class StoreManager extends Manager<Adapter> implements Adapter {
    protected createDriver(raw: Adapter): Adapter {
        return raw
    }

    protected driverType(): string {
        return "Store driver"
    }

    static fromConfig(config: ConfigRepository): StoreManager {
        const adapters = StoreManager.defaultAdapters()
        const active = config.get<string>("store.driver", "memory")

        return new StoreManager(adapters, active, config)
    }

    static defaultAdapters(): Record<DriverName, Adapter> {
        const memory = new MemoryStoreAdapter()
        const hasWindow = typeof window !== "undefined"
        const hasLocal = hasWindow && typeof window.localStorage !== "undefined"
        const hasIndexed = typeof globalThis.indexedDB !== "undefined"

        return {
            memory,
            local: hasLocal ? new LocalStorageAdapter(window.localStorage) : memory,
            indexed: hasIndexed ? new IndexedDbAdapter() : memory,
        }
    }

    driver(name?: string): Adapter {
        return this.resolve(name ?? this.active)
    }

    get(key: string): Promise<unknown>
    get<T>(key: string): Promise<T | null>
    get<T = unknown>(key: string): Promise<T | null> {
        return this.driver().get<T>(key)
    }

    set<T = unknown>(key: string, value: T): Promise<void> {
        return this.driver().set<T>(key, value)
    }

    has(key: string): Promise<boolean> {
        return this.driver().has(key)
    }

    delete(key: string): Promise<void> {
        return this.driver().delete(key)
    }

    clear(): Promise<void> {
        return this.driver().clear()
    }

    keys(): Promise<string[]> {
        return this.driver().keys()
    }
}
