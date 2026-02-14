export type ConfigItems = Record<string, unknown>;
export type ConfigDefaults = Record<string | number, unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveDefault<T>(defaultValue: T | (() => T)): T {
    return typeof defaultValue === "function" ?
            (defaultValue as () => T)()
        :   defaultValue;
}

function dataGet(
    source: unknown,
    path: string,
    defaultValue: unknown = null,
): unknown {
    if (!path) {
        return source;
    }

    const segments = path.split(".");
    let cursor: unknown = source;

    for (const segment of segments) {
        if (isPlainObject(cursor) && segment in cursor) {
            cursor = cursor[segment];
            continue;
        }

        return resolveDefault(defaultValue);
    }

    return cursor;
}

function dataSet(
    target: Record<string, unknown>,
    path: string,
    value: unknown,
): void {
    const segments = path.split(".");
    let cursor: Record<string, unknown> = target;

    for (let i = 0; i < segments.length; i += 1) {
        const segment = segments[i];
        const isLast = i === segments.length - 1;

        if (isLast) {
            cursor[segment] = value;
            return;
        }

        if (!isPlainObject(cursor[segment])) {
            cursor[segment] = {};
        }

        cursor = cursor[segment] as Record<string, unknown>;
    }
}

function dataForget(target: Record<string, unknown>, path: string): void {
    const segments = path.split(".");
    let cursor: Record<string, unknown> = target;

    for (let i = 0; i < segments.length; i += 1) {
        const segment = segments[i];
        const isLast = i === segments.length - 1;

        if (isLast) {
            delete cursor[segment];
            return;
        }

        if (!isPlainObject(cursor[segment])) {
            return;
        }

        cursor = cursor[segment] as Record<string, unknown>;
    }
}

export default class ConfigRepository {
    protected items: ConfigItems;

    constructor(items: ConfigItems = {}) {
        this.items = items;
    }

    has(key: string | string[]): boolean {
        const keys = Array.isArray(key) ? key : [key];
        for (const configKey of keys) {
            if (this.get(configKey) == null) {
                return false;
            }
        }

        return true;
    }

    get<T = unknown>(
        key: string,
        defaultValue?: T | (() => T) | null,
    ): T | null;
    get(key: string[]): Record<string, unknown>;
    get<T = unknown>(
        key: string | string[],
        defaultValue: T | (() => T) | null = null,
    ): T | Record<string, unknown> | null {
        if (Array.isArray(key)) {
            return this.getMany(key);
        }

        return dataGet(this.items, key, defaultValue) as T | null;
    }

    getMany(keys: string[] | ConfigDefaults): Record<string, unknown> {
        const results: Record<string, unknown> = {};

        if (Array.isArray(keys)) {
            for (const key of keys) {
                results[key] = this.get(key);
            }

            return results;
        }

        for (const [key, defaultValue] of Object.entries(keys)) {
            results[key] = this.get(key, defaultValue);
        }

        return results;
    }

    string(
        key: string,
        defaultValue: string | (() => string) | null = null,
    ): string {
        const value = this.get<string>(key, defaultValue);
        if (typeof value !== "string") {
            throw new TypeError(
                `Configuration value [${key}] is not a string.`,
            );
        }

        return value;
    }

    integer(
        key: string,
        defaultValue: number | (() => number) | null = null,
    ): number {
        const value = this.get<number>(key, defaultValue);
        if (typeof value !== "number" || !Number.isInteger(value)) {
            throw new TypeError(
                `Configuration value [${key}] is not an integer.`,
            );
        }

        return value;
    }

    float(
        key: string,
        defaultValue: number | (() => number) | null = null,
    ): number {
        const value = this.get<number>(key, defaultValue);
        if (typeof value !== "number" || Number.isNaN(value)) {
            throw new TypeError(`Configuration value [${key}] is not a float.`);
        }

        return value;
    }

    boolean(
        key: string,
        defaultValue: boolean | (() => boolean) | null = null,
    ): boolean {
        const value = this.get<boolean>(key, defaultValue);
        if (typeof value !== "boolean") {
            throw new TypeError(
                `Configuration value [${key}] is not a boolean.`,
            );
        }

        return value;
    }

    array<T = unknown>(
        key: string,
        defaultValue: T[] | (() => T[]) | null = null,
    ): T[] {
        const value = this.get<T[]>(key, defaultValue);
        if (!Array.isArray(value)) {
            throw new TypeError(
                `Configuration value [${key}] is not an array.`,
            );
        }

        return value;
    }

    set(key: string | ConfigItems, value: unknown = null): void {
        const payload = isPlainObject(key) ? key : { [key]: value };

        for (const [configKey, configValue] of Object.entries(payload)) {
            dataSet(this.items, configKey, configValue);
        }
    }

    prepend(key: string, value: unknown): void {
        const values = this.array<unknown>(key, []);
        this.set(key, [value, ...values]);
    }

    push(key: string, value: unknown): void {
        const values = this.array<unknown>(key, []);
        values.push(value);
        this.set(key, values);
    }

    all(): ConfigItems {
        return this.items;
    }

    offsetExists(key: string): boolean {
        return this.has(key);
    }

    offsetGet<T = unknown>(key: string): T | null {
        return this.get<T>(key) as T | null;
    }

    offsetSet(key: string, value: unknown): void {
        this.set(key, value);
    }

    offsetUnset(key: string): void {
        dataForget(this.items, key);
    }
}
