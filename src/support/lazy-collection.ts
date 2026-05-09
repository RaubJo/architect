import { Collection } from "./collection"

export class LazyCollection<T> implements Iterable<T> {
    private constructor(private readonly source: () => Iterable<T>) {}

    static make<T>(source: (() => Iterable<T>) | Iterable<T>): LazyCollection<T> {
        if (typeof source === "function") {
            return new LazyCollection(source as () => Iterable<T>)
        }
        const captured = source
        return new LazyCollection(() => captured)
    }

    static times<U>(count: number, callback: (n: number) => U): LazyCollection<U> {
        return new LazyCollection(function* () {
            for (let i = 1; i <= count; i++) {
                yield callback(i)
            }
        })
    }

    [Symbol.iterator](): Iterator<T> {
        return this.source()[Symbol.iterator]()
    }

    // ── Lazy (return LazyCollection) ──────────────────────────────────────────

    map<U>(callback: (item: T, index: number) => U): LazyCollection<U> {
        const self = this
        return new LazyCollection(function* () {
            let i = 0
            for (const item of self) {
                yield callback(item, i++)
            }
        })
    }

    filter(callback?: (item: T, index: number) => boolean): LazyCollection<T> {
        const self = this
        return new LazyCollection(function* () {
            let i = 0
            for (const item of self) {
                if (callback ? callback(item, i++) : Boolean(item)) yield item
                else i++
            }
        })
    }

    reject(callback: (item: T, index: number) => boolean): LazyCollection<T> {
        return this.filter((item, i) => !callback(item, i))
    }

    flatMap<U>(callback: (item: T, index: number) => U[]): LazyCollection<U> {
        const self = this
        return new LazyCollection(function* () {
            let i = 0
            for (const item of self) {
                yield* callback(item, i++)
            }
        })
    }

    take(count: number): LazyCollection<T> {
        const self = this
        return new LazyCollection(function* () {
            if (count <= 0) return
            let n = 0
            const iter = self[Symbol.iterator]()
            while (n < count) {
                const { done, value } = iter.next()
                if (done) break
                yield value
                n++
            }
        })
    }

    skip(count: number): LazyCollection<T> {
        const self = this
        return new LazyCollection(function* () {
            let n = 0
            for (const item of self) {
                if (n++ < count) continue
                yield item
            }
        })
    }

    takeUntil(valueOrCallback: T | ((item: T, index: number) => boolean)): LazyCollection<T> {
        const self = this
        return new LazyCollection(function* () {
            let i = 0
            const iter = self[Symbol.iterator]()
            while (true) {
                const { done, value } = iter.next()
                if (done) break
                const match =
                    typeof valueOrCallback === "function"
                        ? (valueOrCallback as (item: T, index: number) => boolean)(value, i++)
                        : value === valueOrCallback
                if (match) break
                yield value
            }
        })
    }

    takeWhile(callback: (item: T, index: number) => boolean): LazyCollection<T> {
        const self = this
        return new LazyCollection(function* () {
            let i = 0
            const iter = self[Symbol.iterator]()
            while (true) {
                const { done, value } = iter.next()
                if (done) break
                if (!callback(value, i++)) break
                yield value
            }
        })
    }

    skipUntil(valueOrCallback: T | ((item: T, index: number) => boolean)): LazyCollection<T> {
        const self = this
        return new LazyCollection(function* () {
            let found = false
            let i = 0
            for (const item of self) {
                if (!found) {
                    const match =
                        typeof valueOrCallback === "function"
                            ? (valueOrCallback as (item: T, index: number) => boolean)(item, i++)
                            : item === valueOrCallback
                    if (match) found = true
                    if (found) yield item
                } else {
                    yield item
                }
            }
        })
    }

    skipWhile(callback: (item: T, index: number) => boolean): LazyCollection<T> {
        const self = this
        return new LazyCollection(function* () {
            let skipping = true
            let i = 0
            for (const item of self) {
                if (skipping && callback(item, i++)) continue
                skipping = false
                yield item
            }
        })
    }

    tap(callback: (item: T) => void): LazyCollection<T> {
        const self = this
        return new LazyCollection(function* () {
            for (const item of self) {
                callback(item)
                yield item
            }
        })
    }

    chunk(size: number): LazyCollection<T[]> {
        const self = this
        return new LazyCollection(function* () {
            let buf: T[] = []
            for (const item of self) {
                buf.push(item)
                if (buf.length === size) {
                    yield buf
                    buf = []
                }
            }
            if (buf.length > 0) yield buf
        })
    }

    concat(other: Iterable<T>): LazyCollection<T> {
        const self = this
        return new LazyCollection(function* () {
            yield* self
            yield* other
        })
    }

    values(): LazyCollection<T> {
        return this
    }

    unique(key?: keyof T | ((item: T) => unknown)): LazyCollection<T> {
        const self = this
        return new LazyCollection(function* () {
            const seen = new Set<unknown>()
            for (const item of self) {
                const v = key ? (typeof key === "function" ? key(item) : (item[key] as unknown)) : item
                if (!seen.has(v)) {
                    seen.add(v)
                    yield item
                }
            }
        })
    }

    pluck<K extends keyof T>(key: K): LazyCollection<T[K]> {
        return this.map((item) => item[key])
    }

    // ── Terminal (materialize) ─────────────────────────────────────────────────

    collect(): Collection<T> {
        return new Collection(this.all())
    }

    all(): T[] {
        return [...this]
    }

    toArray(): T[] {
        return this.all()
    }

    count(): number {
        return this.all().length
    }

    first(callback?: (item: T, index: number) => boolean): T | null {
        let i = 0
        for (const item of this) {
            if (!callback || callback(item, i++)) return item
        }
        return null
    }

    last(callback?: (item: T, index: number) => boolean): T | null {
        let result: T | null = null
        let i = 0
        for (const item of this) {
            if (!callback || callback(item, i++)) result = item
        }
        return result
    }

    each(callback: (item: T, index: number) => void): void {
        let i = 0
        for (const item of this) {
            callback(item, i++)
        }
    }

    reduce<U>(callback: (carry: U, item: T, index: number) => U, initial: U): U {
        let acc = initial
        let i = 0
        for (const item of this) {
            acc = callback(acc, item, i++)
        }
        return acc
    }

    sum(key?: keyof T | ((item: T) => number)): number {
        let total = 0
        for (const item of this) {
            const v = key
                ? typeof key === "function"
                    ? key(item)
                    : (item[key] as unknown as number)
                : (item as unknown as number)
            total += v
        }
        return total
    }

    min(key?: keyof T | ((item: T) => number)): T | null {
        let result: T | null = null
        let minVal: number | null = null
        for (const item of this) {
            const v = key
                ? typeof key === "function"
                    ? key(item)
                    : (item[key] as unknown as number)
                : (item as unknown as number)
            if (minVal === null || v < minVal) {
                minVal = v
                result = item
            }
        }
        return result
    }

    max(key?: keyof T | ((item: T) => number)): T | null {
        let result: T | null = null
        let maxVal: number | null = null
        for (const item of this) {
            const v = key
                ? typeof key === "function"
                    ? key(item)
                    : (item[key] as unknown as number)
                : (item as unknown as number)
            if (maxVal === null || v > maxVal) {
                maxVal = v
                result = item
            }
        }
        return result
    }

    avg(key?: keyof T | ((item: T) => number)): number {
        let total = 0
        let count = 0
        for (const item of this) {
            const v = key
                ? typeof key === "function"
                    ? key(item)
                    : (item[key] as unknown as number)
                : (item as unknown as number)
            total += v
            count++
        }
        return count === 0 ? 0 : total / count
    }

    average(key?: keyof T | ((item: T) => number)): number {
        return this.avg(key)
    }

    contains(item: T | ((item: T) => boolean)): boolean {
        if (typeof item === "function") {
            for (const i of this) {
                if ((item as (item: T) => boolean)(i)) return true
            }
            return false
        }
        for (const i of this) {
            if (i === item) return true
        }
        return false
    }

    every(callback: (item: T, index: number) => boolean): boolean {
        let i = 0
        for (const item of this) {
            if (!callback(item, i++)) return false
        }
        return true
    }

    some(callback: (item: T, index: number) => boolean): boolean {
        let i = 0
        for (const item of this) {
            if (callback(item, i++)) return true
        }
        return false
    }

    groupBy<K extends string>(key: keyof T | ((item: T) => K)): Record<string, LazyCollection<T>> {
        const groups: Record<string, T[]> = {}
        for (const item of this) {
            const k = String(typeof key === "function" ? key(item) : (item[key] as unknown))
            if (!groups[k]) groups[k] = []
            groups[k].push(item)
        }
        return Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, LazyCollection.make(v)]))
    }

    toJson(): string {
        return JSON.stringify(this.all())
    }

    isEmpty(): boolean {
        for (const _ of this) return false
        return true
    }

    isNotEmpty(): boolean {
        return !this.isEmpty()
    }
}
