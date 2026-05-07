/**
 * Configuration contract defining the interface for configuration management
 */
export interface ConfigContract {
  /**
   * Determine if a configuration key exists
   */
  has(key: string | string[]): boolean;

  /**
   * Get a configuration value by key
   */
  get<T = unknown>(key: string, defaultValue?: T | (() => T) | null): T | null;

  /**
   * Get multiple configuration values
   */
  getMany(keys: string[] | Record<string, unknown>): Record<string, unknown>;

  /**
   * Get a configuration value as a string
   */
  string(key: string, defaultValue?: string | (() => string) | null): string;

  /**
   * Get a configuration value as an integer
   */
  integer(key: string, defaultValue?: number | (() => number) | null): number;

  /**
   * Get a configuration value as a float
   */
  float(key: string, defaultValue?: number | (() => number) | null): number;

  /**
   * Get a configuration value as a boolean
   */
  boolean(key: string, defaultValue?: boolean | (() => boolean) | null): boolean;

  /**
   * Get a configuration value as an array
   */
  array<T = unknown>(key: string, defaultValue?: T[] | (() => T[]) | null): T[];

  /**
   * Set a configuration value
   */
  set(key: string | Record<string, unknown>, value?: unknown): void;

  /**
   * Prepend a value to an array configuration
   */
  prepend(key: string, value: unknown): void;

  /**
   * Append a value to an array configuration
   */
  push(key: string, value: unknown): void;

  /**
   * Get all configuration items
   */
  all(): Record<string, unknown>;

  /**
   * Check if a configuration key exists (offset-style)
   */
  offsetExists(key: string): boolean;

  /**
   * Get a configuration value by offset (offset-style)
   */
  offsetGet<T = unknown>(key: string): T | null;

  /**
   * Set a configuration value by offset (offset-style)
   */
  offsetSet(key: string, value: unknown): void;

  /**
   * Remove a configuration key (offset-style)
   */
  offsetUnset(key: string): void;
}