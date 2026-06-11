import { describe, expect, test } from "bun:test"
import * as Arr from "@/support/arr"

describe("Arr", () => {
    test("accessible", () => {
        expect(Arr.accessible([])).toBe(true)
        expect(Arr.accessible({})).toBe(true)
        expect(Arr.accessible(null)).toBe(false)
        expect(Arr.accessible("string")).toBe(false)
        expect(Arr.accessible(1)).toBe(false)
    })

    test("add", () => {
        const obj = { name: "Alice" }
        Arr.add(obj, "name", "Bob")
        expect(obj.name).toBe("Alice")
        Arr.add(obj as Record<string, unknown>, "age", 30)
        expect((obj as Record<string, unknown>).age).toBe(30)
    })

    test("collapse", () => {
        expect(
            Arr.collapse([
                [1, 2],
                [3, 4],
            ]),
        ).toEqual([1, 2, 3, 4])
        expect(Arr.collapse([[1], 2, [3]])).toEqual([1, 2, 3])
    })

    test("crossJoin", () => {
        expect(Arr.crossJoin<number | string>([1, 2], ["a", "b"])).toEqual([
            [1, "a"],
            [1, "b"],
            [2, "a"],
            [2, "b"],
        ])
    })

    test("divide", () => {
        expect(Arr.divide({ a: 1, b: 2 })).toEqual([
            ["a", "b"],
            [1, 2],
        ])
    })

    test("dot", () => {
        expect(Arr.dot({ a: { b: { c: 1 } } })).toEqual({ "a.b.c": 1 })
        expect(Arr.dot({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 })
    })

    test("undot", () => {
        expect(Arr.undot({ "a.b.c": 1 })).toEqual({ a: { b: { c: 1 } } })
    })

    test("every", () => {
        expect(Arr.every([2, 4, 6], (n) => n % 2 === 0)).toBe(true)
        expect(Arr.every([2, 3, 6], (n) => n % 2 === 0)).toBe(false)
    })

    test("except (object)", () => {
        const result = Arr.except({ a: 1, b: 2, c: 3 }, ["b", "c"])
        expect(result).toEqual({ a: 1 })
    })

    test("exceptValues", () => {
        expect(Arr.exceptValues([1, 2, 3, 4], [2, 4])).toEqual([1, 3])
    })

    test("exists", () => {
        expect(Arr.exists({ a: 1 }, "a")).toBe(true)
        expect(Arr.exists({ a: 1 }, "b")).toBe(false)
    })

    test("first", () => {
        expect(Arr.first([1, 2, 3])).toBe(1)
        expect(Arr.first([])).toBeNull()
        expect(Arr.first([], undefined, 0)).toBe(0)
        expect(Arr.first([1, 2, 3], (n) => n > 1)).toBe(2)
        expect(Arr.first([1, 2, 3], (n) => n > 10, -1)).toBe(-1)
    })

    test("last", () => {
        expect(Arr.last([1, 2, 3])).toBe(3)
        expect(Arr.last([])).toBeNull()
        expect(Arr.last([], undefined, 0)).toBe(0)
        expect(Arr.last([1, 2, 3], (n) => n < 3)).toBe(2)
    })

    test("flatten", () => {
        expect(
            Arr.flatten([
                [1, 2],
                [3, 4],
            ]),
        ).toEqual([1, 2, 3, 4])
        expect(Arr.flatten([[1, [2, 3]]], 1)).toEqual([1, [2, 3]])
        expect(Arr.flatten([[1, [2, 3]]])).toEqual([1, 2, 3])
    })

    test("forget", () => {
        const obj = { a: 1, b: { c: 2, d: 3 } }
        Arr.forget(obj as Record<string, unknown>, "b.c")
        expect(obj as Record<string, unknown>).toEqual({ a: 1, b: { d: 3 } })
        Arr.forget(obj as Record<string, unknown>, "a")
        expect(obj as Record<string, unknown>).toEqual({ b: { d: 3 } })
    })

    test("get", () => {
        const obj = { a: { b: { c: 42 } } }
        expect(Arr.get(obj, "a.b.c")).toBe(42)
        expect(Arr.get(obj, "a.x")).toBeNull()
        expect(Arr.get(obj, "a.x", "default")).toBe("default")
    })

    test("has", () => {
        const obj = { a: { b: 1 } }
        expect(Arr.has(obj, "a.b")).toBe(true)
        expect(Arr.has(obj, ["a.b", "a"])).toBe(true)
        expect(Arr.has(obj, "a.c")).toBe(false)
    })

    test("hasAll", () => {
        const obj = { a: 1, b: 2 }
        expect(Arr.hasAll(obj, ["a", "b"])).toBe(true)
        expect(Arr.hasAll(obj, ["a", "c"])).toBe(false)
    })

    test("hasAny", () => {
        const obj = { a: 1, b: 2 }
        expect(Arr.hasAny(obj, ["a", "c"])).toBe(true)
        expect(Arr.hasAny(obj, ["x", "y"])).toBe(false)
    })

    test("isList", () => {
        expect(Arr.isList([])).toBe(true)
        expect(Arr.isList({})).toBe(false)
        expect(Arr.isList(null)).toBe(false)
    })

    test("join", () => {
        expect(Arr.join(["a", "b", "c"], ", ")).toBe("a, b, c")
        expect(Arr.join(["a", "b", "c"], ", ", " and ")).toBe("a, b and c")
        expect(Arr.join(["a"], ", ", " and ")).toBe("a")
        expect(Arr.join([], ", ")).toBe("")
    })

    test("keyBy", () => {
        const result = Arr.keyBy(
            [
                { id: 1, name: "a" },
                { id: 2, name: "b" },
            ],
            "id",
        )
        expect(result).toEqual({
            "1": { id: 1, name: "a" },
            "2": { id: 2, name: "b" },
        })
    })

    test("map", () => {
        expect(Arr.map([1, 2, 3], (n) => n * 2)).toEqual([2, 4, 6])
    })

    test("mapWithKeys", () => {
        const result = Arr.mapWithKeys(
            [
                { id: 1, v: "a" },
                { id: 2, v: "b" },
            ],
            (item) => [String(item.id), item.v],
        )
        expect(result).toEqual({ "1": "a", "2": "b" })
    })

    test("only (object)", () => {
        expect(Arr.only({ a: 1, b: 2, c: 3 }, ["a", "c"])).toEqual({ a: 1, c: 3 })
    })

    test("onlyValues", () => {
        expect(Arr.onlyValues([1, 2, 3, 4], [2, 4])).toEqual([2, 4])
    })

    test("partition", () => {
        const [evens, odds] = Arr.partition([1, 2, 3, 4, 5], (n) => n % 2 === 0)
        expect(evens).toEqual([2, 4])
        expect(odds).toEqual([1, 3, 5])
    })

    test("pluck", () => {
        expect(Arr.pluck([{ n: 1 }, { n: 2 }], "n")).toEqual([1, 2])
    })

    test("prepend", () => {
        expect(Arr.prepend([2, 3], 1)).toEqual([1, 2, 3])
        expect(Arr.prepend([], "a")).toEqual(["a"])
    })

    test("prependKeysWith", () => {
        expect(Arr.prependKeysWith({ a: 1, b: 2 }, "x_")).toEqual({ x_a: 1, x_b: 2 })
    })

    test("pull", () => {
        const obj: Record<string, unknown> = { a: 1, b: 2 }
        const val = Arr.pull(obj, "a")
        expect(val).toBe(1)
        expect(obj).toEqual({ b: 2 })
    })

    test("query", () => {
        const qs = Arr.query({ name: "Alice", age: "30" })
        expect(qs).toContain("name=Alice")
        expect(qs).toContain("age=30")
    })

    test("reject", () => {
        expect(Arr.reject([1, 2, 3, 4], (n) => n % 2 === 0)).toEqual([1, 3])
    })

    test("select", () => {
        const result = Arr.select(
            [
                { a: 1, b: 2 },
                { a: 3, b: 4 },
            ],
            ["a"],
        )
        expect(result).toEqual([{ a: 1 }, { a: 3 }])
    })

    test("set", () => {
        const obj: Record<string, unknown> = {}
        Arr.set(obj, "a.b.c", 42)
        expect(obj).toEqual({ a: { b: { c: 42 } } })
    })

    test("sole", () => {
        expect(Arr.sole([1, 2, 3], (n) => n === 2)).toBe(2)
        expect(() => Arr.sole([1, 2, 3], (n) => n > 1)).toThrow()
        expect(() => Arr.sole([1, 2, 3], (n) => n > 10)).toThrow()
    })

    test("some", () => {
        expect(Arr.some([1, 2, 3], (n) => n > 2)).toBe(true)
        expect(Arr.some([1, 2, 3], (n) => n > 10)).toBe(false)
    })

    test("sort", () => {
        expect(Arr.sort([3, 1, 2])).toEqual([1, 2, 3])
        const orig = [3, 1, 2]
        Arr.sort(orig)
        expect(orig).toEqual([3, 1, 2])
    })

    test("sortDesc", () => {
        expect(Arr.sortDesc([1, 3, 2])).toEqual([3, 2, 1])
    })

    test("take", () => {
        expect(Arr.take([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3])
        expect(Arr.take([1, 2, 3, 4, 5], -2)).toEqual([4, 5])
    })

    test("toCssClasses", () => {
        const result = Arr.toCssClasses({ foo: true, bar: false, baz: true })
        expect(result).toBe("foo baz")
    })

    test("toCssStyles", () => {
        const result = Arr.toCssStyles({ color: "red", display: null, margin: "0" })
        expect(result).toBe("color: red; margin: 0;")
    })

    test("where", () => {
        expect(Arr.where([1, 2, 3, 4], (n) => n > 2)).toEqual([3, 4])
    })

    test("whereNotNull", () => {
        expect(Arr.whereNotNull([1, null, 2, undefined, 3])).toEqual([1, 2, 3])
    })

    test("wrap", () => {
        expect(Arr.wrap(null)).toEqual([])
        expect(Arr.wrap(undefined)).toEqual([])
        expect(Arr.wrap(1)).toEqual([1])
        expect(Arr.wrap([1, 2])).toEqual([1, 2])
    })

    test("Arr object re-export has all methods", () => {
        expect(typeof Arr.Arr.wrap).toBe("function")
        expect(Arr.Arr.wrap([1, 2])).toEqual([1, 2])
    })

    test("mapSpread spreads array items as callback arguments", () => {
        const result = Arr.mapSpread(
            [
                [1, 2],
                [3, 4],
            ],
            (a, b) => (a as number) + (b as number),
        )
        expect(result).toEqual([3, 7])
    })

    test("push sets a nested key on an object", () => {
        const obj: Record<string, unknown> = { a: { b: 1 } }
        const result = Arr.push(obj, "a.c", 2)
        expect(result).toBe(obj)
        expect(obj).toEqual({ a: { b: 1, c: 2 } })
    })

    test("random returns a single item without count", () => {
        const arr = [1, 2, 3, 4, 5]
        const item = Arr.random(arr)
        expect(arr).toContain(item)
    })

    test("random returns an array of N items with count", () => {
        const arr = [1, 2, 3, 4, 5]
        const items = Arr.random(arr, 3) as number[]
        expect(items).toHaveLength(3)
        for (const item of items) expect(arr).toContain(item)
    })

    test("shuffle returns a shuffled copy without mutating original", () => {
        const original = [1, 2, 3, 4, 5]
        const shuffled = Arr.shuffle(original)
        expect(shuffled).toHaveLength(5)
        expect([...shuffled].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5])
        expect(original).toEqual([1, 2, 3, 4, 5])
    })

    test("sortDesc with key sorts objects by key descending", () => {
        const result = Arr.sortDesc([{ n: 1 }, { n: 3 }, { n: 2 }], "n")
        expect(result.map((i) => i.n)).toEqual([3, 2, 1])
    })

    test("sortDesc covers equal-value branch (returns 0)", () => {
        const result = Arr.sortDesc([{ n: 1 }, { n: 1 }], "n")
        expect(result.map((i) => i.n)).toEqual([1, 1])
    })

    test("sortRecursive sorts strings", () => {
        expect(Arr.sortRecursive(["banana", "apple", "cherry"])).toEqual(["apple", "banana", "cherry"])
    })

    test("sortRecursive sorts numbers", () => {
        expect(Arr.sortRecursive([3, 1, 2])).toEqual([1, 2, 3])
    })

    test("sortRecursive sorts nested arrays recursively", () => {
        const result = Arr.sortRecursive([
            [3, 1, 2],
            [6, 4, 5],
        ])
        expect(result).toEqual([
            [1, 2, 3],
            [4, 5, 6],
        ])
    })

    test("sortRecursive sorts object keys and nested arrays", () => {
        const result = Arr.sortRecursive([{ z: [3, 1], a: 2 }])
        const obj = result[0] as { a: number; z: number[] }
        expect(Object.keys(obj)).toEqual(["a", "z"])
        expect(obj.z).toEqual([1, 3])
    })

    test("forget accepts an array of keys and removes each", () => {
        const obj: Record<string, unknown> = { a: 1, b: 2, c: 3 }
        Arr.forget(obj, ["a", "c"])
        expect(obj).toEqual({ b: 2 })
    })

    test("forget silently returns early when an intermediate segment is not an object", () => {
        const obj: Record<string, unknown> = { a: 1 }
        Arr.forget(obj, "a.b.c")
        expect(obj).toEqual({ a: 1 })
    })

    test("get returns fallback when an intermediate segment is not an object", () => {
        const obj: Record<string, unknown> = { a: 1 }
        expect(Arr.get(obj, "a.b")).toBeNull()
        expect(Arr.get(obj, "a.b", "nope")).toBe("nope")
    })

    test("dot preserves array values as leaves and does not recurse into them", () => {
        expect(Arr.dot({ tags: ["x", "y"], name: "z" })).toEqual({ tags: ["x", "y"], name: "z" })
    })

    test("sortDesc equal values without key hit the return-0 branch", () => {
        expect(Arr.sortDesc([1, 1, 1])).toEqual([1, 1, 1])
    })

    test("sortRecursive mixed-type items hit the return-0 fallback in the outer sort", () => {
        const result = Arr.sortRecursive([1, "a"])
        expect(result).toHaveLength(2)
        expect(result).toContain(1)
        expect(result).toContain("a")
    })
})
