import type ConfigRepository from "../config/repository"
import IndexedDbAdapter from "../storage/adapters/indexed-db"
import LocalStorageAdapter from "../storage/adapters/local-storage"
import MemoryStorageAdapter from "../storage/adapters/memory"
import type { Adapter } from "../storage/adapters/contract"
import type { Contract } from "./contract"
import { Cache } from "./cache"
import Manager from "../support/manager"

type StoreConfig = {
    driver?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

export default class CacheManager extends Manager<Contract, Adapter> implements Adapter {
    protected createDriver(raw: Adapter): Contract {
        return new Cache(raw)
    }

    protected defaultDriverName(): string {
        return "memory" in this.drivers ? "memory" : super.defaultDriverName()
    }

    protected driverType(): string {
        return "Cache store"
    }

    static fromConfig(config: ConfigRepository): CacheManager {
        const stores = CacheManager.storesFromConfig(config)
        const active = config.get<string>("cache.default", "memory")

        return new CacheManager(stores, active, config)
    }

    protected static storesFromConfig(config: ConfigRepository): Record<string, Contract> {
        const baseDrivers = CacheManager.defaultDrivers()
        const configured = config.get<Record<string, unknown>>("cache.stores", {}) ?? {}
        if (hasNoConfiguredStores(configured)) {
            return baseDrivers
        }

        return Object.fromEntries(
            Object.entries(configured).map(([name, storeConfig]) => {
                const driver = resolveDriver(storeConfig, name)
                return [name, baseDrivers[driver] ?? baseDrivers.memory]
            }),
        )
    }

    protected static defaultDrivers(): Record<string, Contract> {
        const hasWindow = typeof window !== "undefined"
        const hasLocal = hasWindow && typeof window.localStorage !== "undefined"
        const hasIndexed = typeof globalThis.indexedDB !== "undefined"

        const rawMemory = new MemoryStorageAdapter()
        const memory = new Cache(rawMemory)

        return {
            memory,
            local: new Cache(hasLocal ? new LocalStorageAdapter(window.localStorage) : rawMemory),
            indexed: new Cache(hasIndexed ? new IndexedDbAdapter() : rawMemory),
        }
    }

    store(name?: string): Contract {
        return this.resolve(name ?? this.active)
    }

    get(key: string): Promise<unknown>
    get<T>(key: string): Promise<T | null>
    get<T = unknown>(key: string): Promise<T | null> {
        return this.store().get<T>(key)
    }

    set<T = unknown>(key: string, value: T, ttl?: number | null): Promise<void> {
        return this.store().set<T>(key, value, ttl)
    }

    has(key: string): Promise<boolean> {
        return this.store().has(key)
    }

    delete(key: string): Promise<void> {
        return this.store().delete(key)
    }

    clear(): Promise<void> {
        return this.store().clear()
    }

    keys(): Promise<string[]> {
        return this.store().keys()
    }
}

function hasNoConfiguredStores(value: unknown): boolean {
    return !isRecord(value) || Object.keys(value).length === 0
}

function resolveDriver(value: unknown, fallback: string): string {
    if (!isRecord(value)) {
        return fallback
    }

    const storeConfig = value as StoreConfig
    return typeof storeConfig.driver === "string" ? storeConfig.driver : fallback
}
