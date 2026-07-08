import { describe, expect, test } from "bun:test"
import { Signal } from "@/support/signal"

describe("Signal", () => {
    test("get() returns the initial value", () => {
        const s = new Signal(1)
        expect(s.get()).toBe(1)
    })

    test("set() updates the value and notifies subscribers", () => {
        const s = new Signal(1)
        const seen: number[] = []
        s.subscribe((v) => seen.push(v))

        s.set(2)

        expect(s.get()).toBe(2)
        expect(seen).toEqual([2])
    })

    test("set() with an unchanged value does not notify subscribers", () => {
        const s = new Signal(1)
        let calls = 0
        s.subscribe(() => calls++)

        s.set(1)

        expect(calls).toBe(0)
    })

    test("update() derives the next value from the current one", () => {
        const s = new Signal(1)
        s.update((v) => v + 1)
        expect(s.get()).toBe(2)
    })

    test("unsubscribe stops further notifications", () => {
        const s = new Signal(1)
        let calls = 0
        const unsubscribe = s.subscribe(() => calls++)

        unsubscribe()
        s.set(2)

        expect(calls).toBe(0)
    })
})
