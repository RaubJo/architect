import { afterEach, describe, expect, test } from "bun:test"
import BuiltinContainer from "@/container/adapters/builtin"
import ArchitectError from "@/errors/error"
import { ErrorsProvider } from "@/errors/provider"
import { Bus } from "@/events/bus"

type WindowListener = (event: Record<string, unknown>) => void

function stubWindow() {
    const listeners = new Map<string, WindowListener>()
    ;(globalThis as { window?: unknown }).window = {
        location: { origin: "https://app.test" },
        addEventListener: (event: string, cb: WindowListener, options?: { signal?: AbortSignal }) => {
            listeners.set(event, cb)
            options?.signal?.addEventListener("abort", () => listeners.delete(event))
        },
    }
    return listeners
}

describe("ErrorsProvider", () => {
    afterEach(() => {
        ;(globalThis as { window?: unknown }).window = undefined
    })

    test("registers an events bus when none is bound", () => {
        const container = new BuiltinContainer()
        new ErrorsProvider().register(container)
        expect(container.make("events")).toBeInstanceOf(Bus)
    })

    test("keeps an existing events binding", () => {
        const container = new BuiltinContainer()
        const bus = new Bus()
        container.singleton("events", () => bus)
        new ErrorsProvider().register(container)
        expect(container.make("events")).toBe(bus)
    })

    test("reports window errors and unhandled rejections on the bus", async () => {
        const listeners = stubWindow()
        const container = new BuiltinContainer()
        const provider = new ErrorsProvider()
        provider.register(container)
        const cleanup = provider.boot(container)

        const seen: ArchitectError[] = []
        // Subscribing by class resolves to the same "error" channel via the static label
        container.make<Bus>("events").listen(ArchitectError, (payload) => {
            seen.push(payload)
        })

        const error = new Error("boom")
        listeners.get("error")?.({ error, filename: "https://app.test/assets/app.js" })
        listeners.get("unhandledrejection")?.({ reason: "nope" })
        await Bun.sleep(0)

        expect(seen).toHaveLength(2)
        expect(seen[0]).toBeInstanceOf(ArchitectError)
        expect(seen[0].cause).toBe(error)
        expect(seen[0].message).toBe("boom")
        expect(seen[0].stack).toBe(error.stack)
        expect(seen[0].source).toBe("window")
        expect(seen[1].cause).toBe("nope")
        expect(seen[1].message).toBe("nope")
        expect(seen[1].source).toBe("promise")

        cleanup?.()
        expect(listeners.size).toBe(0)
    })

    test("ignores errors from third-party origins and censored cross-origin scripts", async () => {
        const listeners = stubWindow()
        const container = new BuiltinContainer()
        const provider = new ErrorsProvider()
        provider.register(container)
        provider.boot(container)

        const seen: unknown[] = []
        container.make<Bus>("events").listen("error", (payload) => {
            seen.push(payload)
        })

        listeners.get("error")?.({ error: new Error("ext"), filename: "chrome-extension://abc/content.js" })
        listeners.get("error")?.({ error: new Error("cdn"), filename: "https://cdn.vendor.com/tag.js" })
        listeners.get("error")?.({ message: "Script error.", filename: "" })
        await Bun.sleep(0)

        expect(seen).toEqual([])
    })

    test("boot is a no-op without a window", () => {
        const container = new BuiltinContainer()
        const provider = new ErrorsProvider()
        provider.register(container)
        expect(provider.boot(container)).toBeUndefined()
    })
})
