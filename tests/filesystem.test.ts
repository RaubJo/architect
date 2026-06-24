import { afterEach, describe, expect, test } from "bun:test"
import { createConfig } from "@/config/discovery"

describe("createConfig discovery", () => {
    afterEach(() => {
        ;(
            globalThis as {
                __iocConfigGlobForTests?: unknown
            }
        ).__iocConfigGlobForTests = undefined
    })

    test("loads config from ESM modules when no static items provided", () => {
        ;(
            globalThis as {
                __iocConfigGlobForTests?: (
                    pattern: string | string[],
                    options?: { eager?: boolean },
                ) => Record<string, unknown>
            }
        ).__iocConfigGlobForTests = () => ({
            "/src/config/app.ts": { default: { name: "ESM App" } },
            "/src/config/cache.ts": { default: { driver: "memory" } },
        })

        const config = createConfig("./src")

        expect(config.get<string>("app.name")).toBe("ESM App")
        expect(config.get<string>("cache.driver")).toBe("memory")
    })

    test("skips ESM loading when static items are provided", () => {
        ;(
            globalThis as {
                __iocConfigGlobForTests?: (
                    pattern: string | string[],
                    options?: { eager?: boolean },
                ) => Record<string, unknown>
            }
        ).__iocConfigGlobForTests = () => ({
            "/src/config/app.ts": { default: { name: "ESM App" } },
        })

        const config = createConfig("./src", { app: { name: "Static" } })

        // ESM modules should NOT be loaded when static items are provided
        expect(config.get<string>("app.name")).toBe("Static")
    })

    test("returns independent repository instances", () => {
        const first = createConfig("./", { app: { name: "First" } })
        const second = createConfig("./", { app: { name: "Second" } })

        expect(first.get<string>("app.name")).toBe("First")
        expect(second.get<string>("app.name")).toBe("Second")

        // Mutations don't leak between instances
        first.set("app.name", "Modified")
        expect(first.get<string>("app.name")).toBe("Modified")
        expect(second.get<string>("app.name")).toBe("Second")
    })

    test("returns empty config when no glob implementation is available", () => {
        const config = createConfig("./", {})
        expect(config.all()).toEqual({})
    })
})
