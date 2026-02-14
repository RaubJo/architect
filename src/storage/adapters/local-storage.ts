import type { Adapter } from "@/storage/adapters/contract";

export default class LocalStorageAdapter implements Adapter {
    protected storage: Storage;

    constructor(storage: Storage = window.localStorage) {
        this.storage = storage;
    }

    async get<T = unknown>(key: string): Promise<T | null> {
        const value = this.storage.getItem(key);
        if (value === null) {
            return null;
        }

        return JSON.parse(value) as T;
    }

    async set<T = unknown>(key: string, value: T): Promise<void> {
        this.storage.setItem(key, JSON.stringify(value));
    }

    async has(key: string): Promise<boolean> {
        return this.storage.getItem(key) !== null;
    }

    async delete(key: string): Promise<void> {
        this.storage.removeItem(key);
    }

    async clear(): Promise<void> {
        this.storage.clear();
    }

    async keys(): Promise<string[]> {
        const keys: string[] = [];
        for (let i = 0; i < this.storage.length; i += 1) {
            const key = this.storage.key(i);
            if (key !== null) {
                keys.push(key);
            }
        }

        return keys;
    }
}
