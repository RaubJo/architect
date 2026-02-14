import type ConfigRepository from "../config/repository";
import IndexedDbAdapter from "./adapters/indexed-db";
import LocalStorageAdapter from "./adapters/local-storage";
import MemoryStorageAdapter from "./adapters/memory";
import type { Adapter } from "./adapters/contract";

type DriverName = "memory" | "local" | "indexed";

export default class StorageManager implements Adapter {
    protected adapters: Record<string, Adapter>;
    protected active: string;

    constructor(adapters: Record<string, Adapter>, active: string = "memory") {
        this.adapters = adapters;
        this.active = active in this.adapters ? active : "memory";
    }

    static fromConfig(config: ConfigRepository): StorageManager {
        const adapters = StorageManager.defaultAdapters();
        const driver = config.string("storage.driver", "memory");

        return new StorageManager(adapters, driver);
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

    drv(name?: string): Adapter {
        if (typeof name === "string") {
            if (!(name in this.adapters)) {
                throw new Error(`Storage driver [${name}] is not defined.`);
            }

            return this.adapters[name];
        }

        return this.adapters[this.active];
    }

    use(name: string): this {
        this.active = this.drv(name) ? name : this.active;
        return this;
    }

    get<T = unknown>(key: string): Promise<T | null> {
        return this.drv().get<T>(key);
    }

    set<T = unknown>(key: string, value: T): Promise<void> {
        return this.drv().set<T>(key, value);
    }

    has(key: string): Promise<boolean> {
        return this.drv().has(key);
    }

    delete(key: string): Promise<void> {
        return this.drv().delete(key);
    }

    clear(): Promise<void> {
        return this.drv().clear();
    }

    keys(): Promise<string[]> {
        return this.drv().keys();
    }
}
