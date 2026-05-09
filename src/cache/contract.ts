export interface Contract {
    get<T = unknown>(key: string): Promise<T | null>
    set<T = unknown>(key: string, value: T, ttl?: number | null): Promise<void>
    has(key: string): Promise<boolean>
    delete(key: string): Promise<void>
    clear(): Promise<void>
    keys(): Promise<string[]>
}
