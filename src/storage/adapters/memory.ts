import type { Adapter } from "@/storage/adapters/contract";

export default class MemoryStorageAdapter implements Adapter {
    protected items = new Map<string, unknown>();

    constructor() {}

    async get<T = unknown>(key: string): Promise<T | null> {
        if (!this.items.has(key)) {
            return null;
        }

        return this.items.get(key) as T;
    }

    async set<T = unknown>(key: string, value: T): Promise<void> {
        this.items.set(key, value);
    }

    async has(key: string): Promise<boolean> {
        return this.items.has(key);
    }

    async delete(key: string): Promise<void> {
        this.items.delete(key);
    }

    async clear(): Promise<void> {
        this.items.clear();
    }

    async keys(): Promise<string[]> {
        return Array.from(this.items.keys());
    }
}
