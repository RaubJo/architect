import type ConfigRepository from "@/config/repository";
import IndexedDbAdapter from "@/storage/adapters/indexed-db";
import LocalStorageAdapter from "@/storage/adapters/local-storage";
import MemoryStorageAdapter from "@/storage/adapters/memory";
import type { Adapter } from "@/storage/adapters/contract";
import type { CacheStore } from "@/cache/cache";

type CacheStoreConfig = {
    driver?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default class CacheManager implements Adapter {
    protected stores: Record<string, CacheStore>;
    protected active: string;

    constructor(stores: Record<string, CacheStore>, active = "memory") {
        this.stores = stores;
        this.active =
            active in this.stores ? active : firstStoreName(this.stores);
    }

    static fromConfig(config: ConfigRepository): CacheManager {
        const stores = CacheManager.storesFromConfig(config);
        const active = config.string("cache.default", "memory");

        return new CacheManager(stores, active);
    }

    protected static storesFromConfig(
        config: ConfigRepository,
    ): Record<string, CacheStore> {
        const baseDrivers = CacheManager.defaultDrivers();
        const configured =
            config.get<Record<string, unknown>>("cache.stores", {}) ?? {};
        if (!isRecord(configured) || Object.keys(configured).length === 0) {
            return baseDrivers;
        }

        const stores: Record<string, CacheStore> = {};
        for (const [name, storeConfig] of Object.entries(configured)) {
            const driver = resolveDriver(storeConfig, name);
            stores[name] = baseDrivers[driver] ?? baseDrivers.memory;
        }

        return stores;
    }

    protected static defaultDrivers(): Record<string, CacheStore> {
        const memory = new MemoryStorageAdapter();
        const hasWindow = typeof window !== "undefined";
        const hasLocal =
            hasWindow && typeof window.localStorage !== "undefined";
        const hasIndexed = typeof globalThis.indexedDB !== "undefined";

        return {
            memory,
            local:
                hasLocal ?
                    new LocalStorageAdapter(window.localStorage)
                :   memory,
            indexed: hasIndexed ? new IndexedDbAdapter() : memory,
        };
    }

    store(name?: string): CacheStore {
        const target = typeof name === "string" ? name : this.active;
        if (!(target in this.stores)) {
            throw new Error(`Cache store [${target}] is not defined.`);
        }

        return this.stores[target];
    }

    use(name: string): this {
        this.active = this.store(name) ? name : this.active;
        return this;
    }

    get<T = unknown>(key: string): Promise<T | null> {
        return this.store().get<T>(key);
    }

    set<T = unknown>(key: string, value: T): Promise<void> {
        return this.store().set<T>(key, value);
    }

    has(key: string): Promise<boolean> {
        return this.store().has(key);
    }

    delete(key: string): Promise<void> {
        return this.store().delete(key);
    }

    clear(): Promise<void> {
        return this.store().clear();
    }

    keys(): Promise<string[]> {
        return this.store().keys();
    }
}

function firstStoreName(stores: Record<string, CacheStore>): string {
    if ("memory" in stores) {
        return "memory";
    }

    return Object.keys(stores)[0];
}

function resolveDriver(value: unknown, fallback: string): string {
    if (!isRecord(value)) {
        return fallback;
    }

    const storeConfig = value as CacheStoreConfig;
    return typeof storeConfig.driver === "string" ?
            storeConfig.driver
        :   fallback;
}
