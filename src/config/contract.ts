/**
 * Configuration contract defining the interface for configuration management
 */
export interface Contract {
    /**
     * Determine if a configuration key exists
     */
    has(key: string | string[]): boolean

    /**
     * Get a configuration value by key
     */
    get(key: string): unknown
    get<T>(key: string): T | null
    get<T>(key: string, defaultValue: T | (() => T)): T
    get<T>(key: string, defaultValue: T | (() => T) | null): T | null

    /**
     * Get multiple configuration values
     */
    getMany(keys: string[] | Record<string, unknown>): Record<string, unknown>

    /**
     * Set a configuration value
     */
    set(key: string | Record<string, unknown>, value?: unknown): void

    /**
     * Prepend a value to an array configuration
     */
    prepend(key: string, value: unknown): void

    /**
     * Append a value to an array configuration
     */
    push(key: string, value: unknown): void

    /**
     * Get all configuration items
     */
    all(): Record<string, unknown>

    /**
     * Check if a configuration key exists (offset-style)
     */
    offsetExists(key: string): boolean

    /**
     * Get a configuration value by offset (offset-style)
     */
    offsetGet(key: string): unknown
    offsetGet<T>(key: string): T | null

    /**
     * Set a configuration value by offset (offset-style)
     */
    offsetSet(key: string, value: unknown): void

    /**
     * Remove a configuration key (offset-style)
     */
    offsetUnset(key: string): void
}
