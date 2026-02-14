import type StorageManager from "../../storage/manager";
import type { Adapter } from "../../storage/adapters/contract";
import Facade from "./facade";

export default class Storage extends Facade {
    private constructor() {
        super();
    }

    protected static getFacadeAccessor(): string {
        return "storage";
    }

    static drv(name?: string): Adapter {
        return this.resolveFacadeInstance<StorageManager>().drv(name);
    }

    static use(name: string): Storage {
        this.resolveFacadeInstance<StorageManager>().use(name);
        return this;
    }

    static get<T = unknown>(key: string): Promise<T | null> {
        return this.resolveFacadeInstance<StorageManager>().get<T>(key);
    }

    static set<T = unknown>(key: string, value: T): Promise<void> {
        return this.resolveFacadeInstance<StorageManager>().set<T>(key, value);
    }

    static has(key: string): Promise<boolean> {
        return this.resolveFacadeInstance<StorageManager>().has(key);
    }

    static delete(key: string): Promise<void> {
        return this.resolveFacadeInstance<StorageManager>().delete(key);
    }

    static clear(): Promise<void> {
        return this.resolveFacadeInstance<StorageManager>().clear();
    }

    static keys(): Promise<string[]> {
        return this.resolveFacadeInstance<StorageManager>().keys();
    }
}
