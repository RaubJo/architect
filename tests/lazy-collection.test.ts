import { describe, expect, test } from "bun:test"
import { LazyCollection } from "@/support/lazy-collection"
import { Collection } from "@/support/collection"

describe("LazyCollection", () => {
    // ── make() ────────────────────────────────────────────────────────────────

    test("make() with array", () => {
        const lc = LazyCollection.make([1, 2, 3])
        expect(lc.all()).toEqual([1, 2, 3])
    })

    test("make() with generator function", () => {
        const lc = LazyCollection.make(function* () {
            yield 10
            yield 20
            yield 30
        })
        expect(lc.all()).toEqual([10, 20, 30])
    })

    test("make() with Set", () => {
        const lc = LazyCollection.make(new Set([1, 2, 3]))
        expect(lc.all()).toEqual([1, 2, 3])
    })

    // ── map ───────────────────────────────────────────────────────────────────

    test("map transforms each item", () => {
        expect(
            LazyCollection.make([1, 2, 3])
                .map((n) => n * 2)
                .all(),
        ).toEqual([2, 4, 6])
    })

    test("map passes index", () => {
        expect(
            LazyCollection.make(["a", "b", "c"])
                .map((_, i) => i)
                .all(),
        ).toEqual([0, 1, 2])
    })

    // ── filter ────────────────────────────────────────────────────────────────

    test("filter keeps matching items", () => {
        expect(
            LazyCollection.make([1, 2, 3, 4])
                .filter((n) => n % 2 === 0)
                .all(),
        ).toEqual([2, 4])
    })

    test("filter with no callback drops falsy", () => {
        expect(LazyCollection.make([0, 1, null, 2, false, 3]).filter().all()).toEqual([1, 2, 3])
    })

    // ── reject ────────────────────────────────────────────────────────────────

    test("reject drops matching items", () => {
        expect(
            LazyCollection.make([1, 2, 3, 4])
                .reject((n) => n % 2 === 0)
                .all(),
        ).toEqual([1, 3])
    })

    // ── flatMap ───────────────────────────────────────────────────────────────

    test("flatMap maps and flattens one level", () => {
        expect(
            LazyCollection.make([1, 2, 3])
                .flatMap((n) => [n, n * 10])
                .all(),
        ).toEqual([1, 10, 2, 20, 3, 30])
    })

    // ── take / skip ───────────────────────────────────────────────────────────

    test("take returns first n items", () => {
        expect(LazyCollection.make([1, 2, 3, 4, 5]).take(3).all()).toEqual([1, 2, 3])
    })

    test("skip skips first n items", () => {
        expect(LazyCollection.make([1, 2, 3, 4, 5]).skip(2).all()).toEqual([3, 4, 5])
    })

    // ── takeUntil / takeWhile ─────────────────────────────────────────────────

    test("takeUntil takes until value match", () => {
        expect(LazyCollection.make([1, 2, 3, 4]).takeUntil(3).all()).toEqual([1, 2])
    })

    test("takeUntil takes until callback match", () => {
        expect(
            LazyCollection.make([1, 2, 3, 4])
                .takeUntil((n) => n >= 3)
                .all(),
        ).toEqual([1, 2])
    })

    test("takeWhile takes while condition holds", () => {
        expect(
            LazyCollection.make([1, 2, 3, 4])
                .takeWhile((n) => n < 3)
                .all(),
        ).toEqual([1, 2])
    })

    // ── skipUntil / skipWhile ─────────────────────────────────────────────────

    test("skipUntil skips until value match", () => {
        expect(LazyCollection.make([1, 2, 3, 4]).skipUntil(3).all()).toEqual([3, 4])
    })

    test("skipUntil skips until callback match", () => {
        expect(
            LazyCollection.make([1, 2, 3, 4])
                .skipUntil((n) => n > 2)
                .all(),
        ).toEqual([3, 4])
    })

    test("skipWhile skips while condition holds", () => {
        expect(
            LazyCollection.make([1, 2, 3, 4])
                .skipWhile((n) => n < 3)
                .all(),
        ).toEqual([3, 4])
    })

    // ── chunk ─────────────────────────────────────────────────────────────────

    test("chunk splits into fixed-size arrays", () => {
        const chunks = LazyCollection.make([1, 2, 3, 4, 5]).chunk(2).all()
        expect(chunks).toEqual([[1, 2], [3, 4], [5]])
    })

    // ── concat ────────────────────────────────────────────────────────────────

    test("concat appends another iterable", () => {
        expect(LazyCollection.make([1, 2]).concat([3, 4]).all()).toEqual([1, 2, 3, 4])
        expect(
            LazyCollection.make([1])
                .concat(LazyCollection.make([2, 3]))
                .all(),
        ).toEqual([1, 2, 3])
    })

    // ── collect() → Collection ────────────────────────────────────────────────

    test("collect() materializes into Collection", () => {
        const col = LazyCollection.make([1, 2, 3]).collect()
        expect(col).toBeInstanceOf(Collection)
        expect(col.all()).toEqual([1, 2, 3])
    })

    // ── all / count / first / last ────────────────────────────────────────────

    test("all() returns array", () => {
        expect(LazyCollection.make([7, 8, 9]).all()).toEqual([7, 8, 9])
    })

    test("count() counts items", () => {
        expect(LazyCollection.make([1, 2, 3, 4]).count()).toBe(4)
    })

    test("first() with and without callback", () => {
        expect(LazyCollection.make([1, 2, 3]).first()).toBe(1)
        expect(LazyCollection.make([1, 2, 3]).first((n) => n > 1)).toBe(2)
        expect(LazyCollection.make<number>([]).first()).toBeNull()
    })

    test("last() with and without callback", () => {
        expect(LazyCollection.make([1, 2, 3]).last()).toBe(3)
        expect(LazyCollection.make([1, 2, 3]).last((n) => n < 3)).toBe(2)
        expect(LazyCollection.make<number>([]).last()).toBeNull()
    })

    // ── each ─────────────────────────────────────────────────────────────────

    test("each visits all items", () => {
        const seen: number[] = []
        LazyCollection.make([10, 20, 30]).each((n) => seen.push(n))
        expect(seen).toEqual([10, 20, 30])
    })

    test("each passes index", () => {
        const indices: number[] = []
        LazyCollection.make(["a", "b"]).each((_, i) => indices.push(i))
        expect(indices).toEqual([0, 1])
    })

    // ── reduce ────────────────────────────────────────────────────────────────

    test("reduce accumulates", () => {
        expect(LazyCollection.make([1, 2, 3, 4]).reduce((acc, n) => acc + n, 0)).toBe(10)
    })

    // ── sum / min / max / avg ─────────────────────────────────────────────────

    test("sum", () => {
        expect(LazyCollection.make([1, 2, 3]).sum()).toBe(6)
        expect(LazyCollection.make([{ v: 5 }, { v: 10 }]).sum("v")).toBe(15)
        expect(LazyCollection.make([{ v: 5 }, { v: 10 }]).sum((i) => i.v * 2)).toBe(30)
    })

    test("min and max", () => {
        expect(LazyCollection.make([3, 1, 4]).min()).toBe(1)
        expect(LazyCollection.make([3, 1, 4]).max()).toBe(4)
        expect(LazyCollection.make<number>([]).min()).toBeNull()
        expect(LazyCollection.make<number>([]).max()).toBeNull()
        const objs = LazyCollection.make([{ n: 3 }, { n: 1 }, { n: 2 }])
        expect(objs.min("n")).toEqual({ n: 1 })
        expect(objs.max("n")).toEqual({ n: 3 })
    })

    test("avg and average", () => {
        expect(LazyCollection.make([1, 2, 3, 4]).avg()).toBe(2.5)
        expect(LazyCollection.make([1, 2, 3, 4]).average()).toBe(2.5)
        expect(LazyCollection.make<number>([]).avg()).toBe(0)
        expect(LazyCollection.make([{ v: 10 }, { v: 20 }]).avg("v")).toBe(15)
    })

    // ── contains / every / some ───────────────────────────────────────────────

    test("contains with value", () => {
        expect(LazyCollection.make([1, 2, 3]).contains(2)).toBe(true)
        expect(LazyCollection.make([1, 2, 3]).contains(9)).toBe(false)
    })

    test("contains with callback", () => {
        expect(LazyCollection.make([1, 2, 3]).contains((n) => n > 2)).toBe(true)
        expect(LazyCollection.make([1, 2, 3]).contains((n) => n > 10)).toBe(false)
    })

    test("every returns true if all pass", () => {
        expect(LazyCollection.make([2, 4, 6]).every((n) => n % 2 === 0)).toBe(true)
        expect(LazyCollection.make([2, 3, 6]).every((n) => n % 2 === 0)).toBe(false)
    })

    test("some returns true if any pass", () => {
        expect(LazyCollection.make([1, 2, 3]).some((n) => n === 3)).toBe(true)
        expect(LazyCollection.make([1, 2, 3]).some((n) => n > 10)).toBe(false)
    })

    // ── groupBy ───────────────────────────────────────────────────────────────

    test("groupBy returns grouped LazyCollections", () => {
        const groups = LazyCollection.make([
            { type: "a", v: 1 },
            { type: "b", v: 2 },
            { type: "a", v: 3 },
        ]).groupBy("type")
        expect(groups.a.all()).toEqual([
            { type: "a", v: 1 },
            { type: "a", v: 3 },
        ])
        expect(groups.b.all()).toEqual([{ type: "b", v: 2 }])
    })

    test("groupBy with callback", () => {
        const groups = LazyCollection.make([1, 2, 3, 4]).groupBy(
            (n) => (n % 2 === 0 ? "even" : "odd") as "even" | "odd",
        )

        expect(groups.odd.all()).toEqual([1, 3])
        expect(groups.even.all()).toEqual([2, 4])
    })

    // ── pluck ─────────────────────────────────────────────────────────────────

    test("pluck extracts a key from each item", () => {
        expect(
            LazyCollection.make([{ name: "a" }, { name: "b" }])
                .pluck("name")
                .all(),
        ).toEqual(["a", "b"])
    })

    // ── unique ────────────────────────────────────────────────────────────────

    test("unique deduplicates primitives", () => {
        expect(LazyCollection.make([1, 2, 1, 3, 2]).unique().all()).toEqual([1, 2, 3])
    })

    test("unique with key", () => {
        const lc = LazyCollection.make([{ v: 1 }, { v: 2 }, { v: 1 }]).unique("v")
        expect(lc.count()).toBe(2)
    })

    // ── tap ───────────────────────────────────────────────────────────────────

    test("tap has side effects but chain continues with unchanged items", () => {
        const seen: number[] = []
        const result = LazyCollection.make([1, 2, 3])
            .tap((n) => seen.push(n))
            .map((n) => n * 10)
            .all()
        expect(seen).toEqual([1, 2, 3])
        expect(result).toEqual([10, 20, 30])
    })

    // ── times() ───────────────────────────────────────────────────────────────

    test("times() invokes callback 1..n lazily", () => {
        expect(LazyCollection.times(4, (n) => n * n).all()).toEqual([1, 4, 9, 16])
    })

    // ── toJson / isEmpty / isNotEmpty ─────────────────────────────────────────

    test("toJson serializes to JSON string", () => {
        expect(LazyCollection.make([1, 2, 3]).toJson()).toBe("[1,2,3]")
    })

    test("isEmpty and isNotEmpty", () => {
        expect(LazyCollection.make([]).isEmpty()).toBe(true)
        expect(LazyCollection.make([1]).isEmpty()).toBe(false)
        expect(LazyCollection.make([]).isNotEmpty()).toBe(false)
        expect(LazyCollection.make([1]).isNotEmpty()).toBe(true)
    })

    // ── Laziness: infinite generators ─────────────────────────────────────────

    test("take(2) on infinite generator only yields 2 items", () => {
        function* infiniteIntegers() {
            let n = 0
            while (true) yield n++
        }

        const consumed: number[] = []
        const result = LazyCollection.make(infiniteIntegers)
            .tap((n) => consumed.push(n))
            .take(2)
            .all()

        expect(result).toEqual([0, 1])
        // Only 2 items should have been consumed from the generator
        expect(consumed).toEqual([0, 1])
    })

    test("chained lazy ops on infinite generator stay lazy", () => {
        function* naturals() {
            let n = 1
            while (true) yield n++
        }

        const result = LazyCollection.make(naturals)
            .filter((n) => n % 2 === 0) // evens
            .map((n) => n * n) // squared
            .take(3)
            .all()

        expect(result).toEqual([4, 16, 36]) // 2², 4², 6²
    })

    test("values() is identity — returns same items lazily", () => {
        expect(LazyCollection.make([1, 2, 3]).values().all()).toEqual([1, 2, 3])
    })

    test("toArray() is an alias for all()", () => {
        expect(LazyCollection.make([1, 2, 3]).toArray()).toEqual([1, 2, 3])
    })

    // ── Iterable protocol ─────────────────────────────────────────────────────

    test("is iterable via for-of", () => {
        const items: number[] = []
        for (const n of LazyCollection.make([1, 2, 3])) {
            items.push(n)
        }
        expect(items).toEqual([1, 2, 3])
    })

    test("can be spread into array", () => {
        expect([...LazyCollection.make([7, 8, 9])]).toEqual([7, 8, 9])
    })
})
