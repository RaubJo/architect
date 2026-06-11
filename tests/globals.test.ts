import { describe, expect, test } from "bun:test"
import { registerGlobalHelpers } from "@/support/globals"

describe("registerGlobalHelpers", () => {
    test("sets new keys on globalThis", () => {
        const g = globalThis as Record<string, unknown>
        delete g.__rgh_new__
        registerGlobalHelpers({ __rgh_new__: 42 })
        expect(g.__rgh_new__).toBe(42)
    })

    test("does not overwrite keys that already exist", () => {
        const g = globalThis as Record<string, unknown>
        g.__rgh_existing__ = "original"
        registerGlobalHelpers({ __rgh_existing__: "should not overwrite" })
        expect(g.__rgh_existing__).toBe("original")
    })
})
