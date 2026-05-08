import ConfigRepository from "../config/repository";
import IndexedDbAdapter from "./adapters/indexed-db";
import LocalStorageAdapter from "./adapters/local-storage";
import MemoryStorageAdapter from "./adapters/memory";
import type { Adapter } from "./adapters/contract";
import Manager from "../support/manager";

type DriverName = "memory" | "local" | "indexed";

export default class StorageManager extends Manager<Adapter> implements Adapter {
    protected createDriver(raw: Adapter): Adapter {
        return raw;
    }

    protected driverType(): string {
        return "Storage driver";
    }

    static fromConfig(config: ConfigRepository): StorageManager {
        const adapters = StorageManager.defaultAdapters();
        const active = config.get<string>("storage.driver", "memory");

        return new StorageManager(adapters, active, config);
    }

    static defaultAdapters(): Record<DriverName, Adapter> {
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

    driver(name?: string): Adapter {
        return this.resolve(name ?? this.active);
    }

    get<T = unknown>(key: string): Promise<T | null> {
        return this.driver().get<T>(key);
    }

    set<T = unknown>(key: string, value: T): Promise<void> {
        return this.driver().set<T>(key, value);
    }

    has(key: string): Promise<boolean> {
        return this.driver().has(key);
    }

    delete(key: string): Promise<void> {
        return this.driver().delete(key);
    }

    clear(): Promise<void> {
        return this.driver().clear();
    }

    keys(): Promise<string[]> {
        return this.driver().keys();
    }
}
