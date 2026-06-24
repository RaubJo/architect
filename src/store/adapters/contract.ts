export interface Adapter {
    get(key: string): Promise<unknown>
    get<T>(key: string): Promise<T | null>
    set<T = unknown>(key: string, value: T): Promise<void>
    has(key: string): Promise<boolean>
    delete(key: string): Promise<void>
    clear(): Promise<void>
    keys(): Promise<string[]>
}
