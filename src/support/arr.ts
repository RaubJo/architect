type AnyObject = Record<string, unknown>;

export function accessible(value: unknown): value is unknown[] | AnyObject {
    return Array.isArray(value) || (typeof value === "object" && value !== null);
}

export function add<T extends AnyObject>(obj: T, key: string, value: unknown): T {
    if (get(obj, key) === null) set(obj as AnyObject, key, value);
    return obj;
}

export function collapse<T>(arr: (T | T[])[]): T[] {
    const result: T[] = [];
    for (const item of arr) {
        if (Array.isArray(item)) result.push(...item);
        else result.push(item);
    }
    return result;
}

export function crossJoin<T>(...arrays: T[][]): T[][] {
    let result: T[][] = [[]];
    for (const arr of arrays) {
        const next: T[][] = [];
        for (const existing of result) {
            for (const item of arr) next.push([...existing, item]);
        }
        result = next;
    }
    return result;
}

export function divide<T extends AnyObject>(obj: T): [string[], unknown[]] {
    return [Object.keys(obj), Object.values(obj)];
}

export function dot(obj: AnyObject, prepend = ""): AnyObject {
    const result: AnyObject = {};
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prepend ? `${prepend}.${key}` : key;
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            Object.assign(result, dot(value as AnyObject, fullKey));
        } else {
            result[fullKey] = value;
        }
    }
    return result;
}

export function undot(obj: AnyObject): AnyObject {
    const result: AnyObject = {};
    for (const [key, value] of Object.entries(obj)) set(result, key, value);
    return result;
}

export function every<T>(arr: T[], callback: (item: T, index: number) => boolean): boolean {
    return arr.every(callback);
}

export function except<T extends AnyObject>(obj: T, keys: string[]): AnyObject {
    const result = { ...obj } as AnyObject;
    for (const key of keys) forget(result, key);
    return result;
}

export function exceptValues<T>(arr: T[], values: T[]): T[] {
    return arr.filter((item) => !values.includes(item));
}

export function exists<T extends AnyObject>(obj: T, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

export function first<T>(arr: T[], callback?: (item: T) => boolean, fallback: T | null = null): T | null {
    if (!callback) return arr[0] ?? fallback;
    return arr.find(callback) ?? fallback;
}

export function last<T>(arr: T[], callback?: (item: T) => boolean, fallback: T | null = null): T | null {
    if (!callback) return arr[arr.length - 1] ?? fallback;
    return [...arr].reverse().find(callback) ?? fallback;
}

export function flatten(arr: unknown[], depth = Infinity): unknown[] {
    return arr.flat(depth);
}

export function forget(obj: AnyObject, keys: string | string[]): void {
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const key of keyList) {
        const parts = key.split(".");
        let current: AnyObject = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (typeof current[part] !== "object" || current[part] === null) return;
            current = current[part] as AnyObject;
        }
        delete current[parts[parts.length - 1]];
    }
}

export function get<T = unknown>(obj: AnyObject, key: string, fallback: T | null = null): T | null {
    const parts = key.split(".");
    let current: unknown = obj;
    for (const part of parts) {
        if (typeof current !== "object" || current === null || !(part in (current as AnyObject))) return fallback;
        current = (current as AnyObject)[part];
    }
    return current as T;
}

export function has(obj: AnyObject, keys: string | string[]): boolean {
    const keyList = Array.isArray(keys) ? keys : [keys];
    return keyList.every((key) => get(obj, key) !== null);
}

export function hasAll(obj: AnyObject, keys: string[]): boolean {
    return keys.every((key) => get(obj, key) !== null);
}

export function hasAny(obj: AnyObject, keys: string[]): boolean {
    return keys.some((key) => get(obj, key) !== null);
}

export function isList(arr: unknown): boolean {
    return Array.isArray(arr);
}

export function join<T>(arr: T[], glue: string, finalGlue = ""): string {
    if (arr.length === 0) return "";
    if (arr.length === 1) return String(arr[0]);
    if (!finalGlue) return arr.join(glue);
    return arr.slice(0, -1).join(glue) + finalGlue + String(arr[arr.length - 1]);
}

export function keyBy<T>(arr: T[], key: keyof T): AnyObject {
    const result: AnyObject = {};
    for (const item of arr) result[String(item[key])] = item;
    return result;
}

export function map<T, U>(arr: T[], callback: (item: T, index: number) => U): U[] {
    return arr.map(callback);
}

export function mapSpread<T extends unknown[], U>(arr: T[], callback: (...args: unknown[]) => U): U[] {
    return arr.map((item) => callback(...(item as unknown[])));
}

export function mapWithKeys<T, U>(arr: T[], callback: (item: T) => [string, U]): Record<string, U> {
    const result: Record<string, U> = {};
    for (const item of arr) {
        const [key, value] = callback(item);
        result[key] = value;
    }
    return result;
}

export function only<T extends AnyObject>(obj: T, keys: string[]): AnyObject {
    const result: AnyObject = {};
    for (const key of keys) if (key in obj) result[key] = obj[key];
    return result;
}

export function onlyValues<T>(arr: T[], values: T[]): T[] {
    return arr.filter((item) => values.includes(item));
}

export function partition<T>(arr: T[], callback: (item: T) => boolean): [T[], T[]] {
    const pass: T[] = [];
    const fail: T[] = [];
    for (const item of arr) (callback(item) ? pass : fail).push(item);
    return [pass, fail];
}

export function pluck<T>(arr: T[], key: keyof T): unknown[] {
    return arr.map((item) => item[key]);
}

export function prepend<T>(arr: T[], value: T): T[] {
    return [value, ...arr];
}

export function prependKeysWith(obj: AnyObject, prefix: string): AnyObject {
    const result: AnyObject = {};
    for (const [key, value] of Object.entries(obj)) result[`${prefix}${key}`] = value;
    return result;
}

export function pull<T extends AnyObject>(obj: T, key: string, fallback: unknown = null): unknown {
    const value = get(obj, key, fallback as null);
    forget(obj as AnyObject, key);
    return value;
}

export function push<T extends AnyObject>(obj: T, key: string, value: unknown): T {
    set(obj as AnyObject, key, value);
    return obj;
}

export function query(obj: AnyObject): string {
    return new URLSearchParams(
        Object.entries(dot(obj)).map(([k, v]) => [k, String(v)]),
    ).toString();
}

export function random<T>(arr: T[], number?: number): T | T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    if (number === undefined) return shuffled[0];
    return shuffled.slice(0, number);
}

export function reject<T>(arr: T[], callback: (item: T) => boolean): T[] {
    return arr.filter((item) => !callback(item));
}

export function select<T extends AnyObject>(arr: T[], keys: string[]): AnyObject[] {
    return arr.map((item) => only(item, keys));
}

export function set(obj: AnyObject, key: string, value: unknown): AnyObject {
    const parts = key.split(".");
    let current: AnyObject = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (typeof current[part] !== "object" || current[part] === null) current[part] = {};
        current = current[part] as AnyObject;
    }
    current[parts[parts.length - 1]] = value;
    return obj;
}

export function shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export function sole<T>(arr: T[], callback: (item: T) => boolean): T {
    const matches = arr.filter(callback);
    if (matches.length !== 1) throw new Error(`Expected exactly one match, found ${matches.length}.`);
    return matches[0];
}

export function some<T>(arr: T[], callback: (item: T) => boolean): boolean {
    return arr.some(callback);
}

export function sort<T>(arr: T[], callback?: (a: T, b: T) => number): T[] {
    return [...arr].sort(callback);
}

export function sortDesc<T>(arr: T[], key?: keyof T): T[] {
    return [...arr].sort((a, b) => {
        const va = key ? a[key] : a;
        const vb = key ? b[key] : b;
        if (va < vb) return 1;
        if (va > vb) return -1;
        return 0;
    });
}

export function sortRecursive(arr: unknown[]): unknown[] {
    return [...arr]
        .map((item) => {
            if (Array.isArray(item)) return sortRecursive(item);
            if (typeof item === "object" && item !== null) {
                const obj = item as AnyObject;
                return Object.fromEntries(
                    Object.entries(obj)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([k, v]) => [k, Array.isArray(v) ? sortRecursive(v) : v]),
                );
            }
            return item;
        })
        .sort((a, b) => {
            if (typeof a === "string" && typeof b === "string") return a.localeCompare(b);
            if (typeof a === "number" && typeof b === "number") return a - b;
            return 0;
        });
}

export function take<T>(arr: T[], limit: number): T[] {
    return limit < 0 ? arr.slice(limit) : arr.slice(0, limit);
}

export function toCssClasses(classes: Record<string, boolean | null | undefined>): string {
    return Object.entries(classes)
        .filter(([, v]) => Boolean(v))
        .map(([k]) => k)
        .join(" ");
}

export function toCssStyles(styles: Record<string, string | null | undefined>): string {
    return Object.entries(styles)
        .filter(([, v]) => v != null)
        .map(([k, v]) => `${k}: ${v};`)
        .join(" ");
}

export function where<T>(arr: T[], callback: (item: T) => boolean): T[] {
    return arr.filter(callback);
}

export function whereNotNull<T>(arr: (T | null | undefined)[]): T[] {
    return arr.filter((item): item is T => item != null);
}

export function wrap<T>(value: T | T[] | null | undefined): T[] {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value;
    return [value];
}

export const Arr = {
    accessible, add, collapse, crossJoin, divide, dot, undot, every, except,
    exceptValues, exists, first, last, flatten, forget, get, has, hasAll, hasAny,
    isList, join, keyBy, map, mapSpread, mapWithKeys, only, onlyValues, partition,
    pluck, prepend, prependKeysWith, pull, push, query, random, reject, select,
    set, shuffle, sole, some, sort, sortDesc, sortRecursive, take, toCssClasses,
    toCssStyles, where, whereNotNull, wrap,
};
