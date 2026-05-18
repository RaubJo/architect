import type { Adapter } from "../storage/adapters/contract"
import type { Contract } from "./contract"

type Envelope<T> = { v: T; e: number | null }

export class Cache implements Contract {
    constructor(private readonly adapter: Adapter) {}

    async get(key: string): Promise<unknown>
    async get<T>(key: string): Promise<T | null>
    async get<T = unknown>(key: string): Promise<T | null> {
        const raw = await this.adapter.get<Envelope<T>>(key)
        if (raw === null) return null
        if (raw.e !== null && Date.now() >= raw.e) return null
        return raw.v
    }

    async set<T = unknown>(key: string, value: T, ttl?: number | null): Promise<void> {
        const e = typeof ttl === "number" ? Date.now() + ttl * 1000 : null
        return this.adapter.set<Envelope<T>>(key, { v: value, e })
    }

    async has(key: string): Promise<boolean> {
        return (await this.get(key)) !== null
    }

    async delete(key: string): Promise<void> {
        return this.adapter.delete(key)
    }

    async clear(): Promise<void> {
        return this.adapter.clear()
    }

    async keys(): Promise<string[]> {
        const allKeys = await this.adapter.keys()
        const now = Date.now()
        const alive: string[] = []
        for (const k of allKeys) {
            const raw = await this.adapter.get<Envelope<unknown>>(k)
            if (raw !== null && (raw.e === null || now < raw.e)) {
                alive.push(k)
            }
        }
        return alive
    }
}
