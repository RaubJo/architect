export class Fluent<T extends Record<string, unknown> = Record<string, unknown>> {
    protected attributes: Record<string, unknown>;

    constructor(attributes: T = {} as T) {
        this.attributes = { ...attributes };
    }

    get<V = unknown>(key: string, defaultValue: V | null = null): V | null {
        const parts = key.split(".");
        let current: unknown = this.attributes;
        for (const part of parts) {
            if (current === null || current === undefined || typeof current !== "object") return defaultValue;
            current = (current as Record<string, unknown>)[part];
        }
        return (current === undefined ? defaultValue : current) as V | null;
    }

    set(key: string, value: unknown): this {
        const parts = key.split(".");
        let current = this.attributes;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (typeof current[part] !== "object" || current[part] === null) current[part] = {};
            current = current[part] as Record<string, unknown>;
        }
        current[parts[parts.length - 1]] = value;
        return this;
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    toArray(): T {
        return { ...this.attributes } as T;
    }
}
