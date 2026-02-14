import type CacheManager from "../../cache/manager";
import type { CacheStore } from "../../cache/cache";
import Facade from "./facade";

export default class Cache extends Facade {
    private constructor() {
        super();
    }

    protected static getFacadeAccessor(): string {
        return "cache";
    }

    static store(name?: string): CacheStore {
        return this.resolveFacadeInstance<CacheManager>().store(name);
    }

    static use(name: string): Cache {
        this.resolveFacadeInstance<CacheManager>().use(name);
        return this;
    }

    static get<T = unknown>(key: string): Promise<T | null> {
        return this.resolveFacadeInstance<CacheManager>().get<T>(key);
    }

    static set<T = unknown>(key: string, value: T): Promise<void> {
        return this.resolveFacadeInstance<CacheManager>().set<T>(key, value);
    }

    static has(key: string): Promise<boolean> {
        return this.resolveFacadeInstance<CacheManager>().has(key);
    }

    static delete(key: string): Promise<void> {
        return this.resolveFacadeInstance<CacheManager>().delete(key);
    }

    static clear(): Promise<void> {
        return this.resolveFacadeInstance<CacheManager>().clear();
    }

    static keys(): Promise<string[]> {
        return this.resolveFacadeInstance<CacheManager>().keys();
    }
}
