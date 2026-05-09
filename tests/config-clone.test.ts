import { describe, expect, test } from "bun:test"
import { createConfig } from "@/config/discovery"

describe("createConfig discovery", () => {
    test("merges ESM config modules with static items", () => {
        ;(globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } }).window = {
            addEventListener: () => {},
        }

        const config = createConfig("./src", { app: { name: "Static" } })

        // Static items override ESM modules
        expect(config.get("app.name")).toBe("Static")
    })

    test("returns independent repository instances", () => {
        ;(globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } }).window = {
            addEventListener: () => {},
        }

        const first = createConfig("./", { app: { name: "First" } })
        const second = createConfig("./", { app: { name: "Second" } })

        expect(first.get("app.name")).toBe("First")
        expect(second.get("app.name")).toBe("Second")

        // Mutations don't leak between instances
        first.set("app.name", "Modified")
        expect(first.get("app.name")).toBe("Modified")
        expect(second.get("app.name")).toBe("Second")
    })

    test("covers fileNameWithoutExtension helper", () => {
        const config = createConfig("./", {})
        expect(config.all()).toEqual({})
    })

    test("covers loadConfigFromModules with no default export", () => {
        ;(globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } }).window = {
            addEventListener: () => {},
        }

        // Mock modules without default exports.
        ;(globalThis as { __iocConfigGlobForTests?: unknown }).__iocConfigGlobForTests = () => ({
            "/src/config/app.ts": { named: true },
        })

        const config = createConfig("./src")
        expect(config.get("app")).toBeNull()
    })

    test("covers cloneItems JSON fallback when structuredClone unavailable", () => {
        ;(globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } }).window = {
            addEventListener: () => {},
        }

        // Remove structuredClone to force JSON fallback.
        const original = globalThis.structuredClone
        ;(globalThis as { structuredClone?: unknown }).structuredClone = undefined

        const config = createConfig("./", { app: { name: "Test" } })
        expect(config.get("app.name")).toBe("Test")

        // Restore.
        globalThis.structuredClone = original
    })

    test("covers loadEsmConfigModules when no glob available", () => {
        ;(globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } }).window = {
            addEventListener: () => {},
        }

        // Mock no glob function available.
        ;(globalThis as { __iocConfigGlobForTests?: unknown }).__iocConfigGlobForTests = undefined

        const config = createConfig("./src")
        expect(config.all()).toEqual({})
    })
})
