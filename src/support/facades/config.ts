import type ConfigRepository from "../../config/repository";
import type { ConfigDefaults, ConfigItems } from "../../config/repository";
import Facade from "./facade";

export default class Config extends Facade {
    private constructor() {
        super();
    }

    protected static getFacadeAccessor(): string {
        return "config";
    }

    static has(key: string | string[]): boolean {
        return this.resolveFacadeInstance<ConfigRepository>().has(key);
    }

    static get<T = unknown>(
        key: string | string[],
        defaultValue: T | (() => T) | null = null,
    ): T | Record<string, unknown> | null {
        return this.resolveFacadeInstance<ConfigRepository>().get<T>(
            key,
            defaultValue,
        );
    }

    static getMany(keys: string[] | ConfigDefaults): Record<string, unknown> {
        return this.resolveFacadeInstance<ConfigRepository>().getMany(keys);
    }

    static string(
        key: string,
        defaultValue: string | (() => string) | null = null,
    ): string {
        return this.resolveFacadeInstance<ConfigRepository>().string(
            key,
            defaultValue,
        );
    }

    static integer(
        key: string,
        defaultValue: number | (() => number) | null = null,
    ): number {
        return this.resolveFacadeInstance<ConfigRepository>().integer(
            key,
            defaultValue,
        );
    }

    static float(
        key: string,
        defaultValue: number | (() => number) | null = null,
    ): number {
        return this.resolveFacadeInstance<ConfigRepository>().float(
            key,
            defaultValue,
        );
    }

    static boolean(
        key: string,
        defaultValue: boolean | (() => boolean) | null = null,
    ): boolean {
        return this.resolveFacadeInstance<ConfigRepository>().boolean(
            key,
            defaultValue,
        );
    }

    static array<T = unknown>(
        key: string,
        defaultValue: T[] | (() => T[]) | null = null,
    ): T[] {
        return this.resolveFacadeInstance<ConfigRepository>().array<T>(
            key,
            defaultValue,
        );
    }

    static set(key: string | ConfigItems, value: unknown = null): void {
        this.resolveFacadeInstance<ConfigRepository>().set(key, value);
    }

    static prepend(key: string, value: unknown): void {
        this.resolveFacadeInstance<ConfigRepository>().prepend(key, value);
    }

    static push(key: string, value: unknown): void {
        this.resolveFacadeInstance<ConfigRepository>().push(key, value);
    }

    static all(): ConfigItems {
        return this.resolveFacadeInstance<ConfigRepository>().all();
    }
}
