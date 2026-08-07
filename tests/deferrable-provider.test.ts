import { describe, expect, test } from "bun:test"
import { Application } from "@/foundation/application"
import ServiceProvider, { DeferrableServiceProvider } from "@/support/service-provider"

function stubWindow() {
    ;(globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } }).window = {
        addEventListener: () => {},
    }
}

class Reporting {
    connected = false
    connect() {
        this.connected = true
    }
}

describe("DeferrableServiceProvider", () => {
    test("does not register or boot until a provided identifier is resolved", () => {
        stubWindow()
        const calls: string[] = []

        class ReportingProvider extends DeferrableServiceProvider {
            provides() {
                return ["reporting"]
            }

            register(container: import("@/container/contract").Container) {
                calls.push("register")
                container.singleton("reporting", Reporting)
            }

            boot() {
                calls.push("boot")
            }
        }

        const running = Application.configure("./").withProviders([new ReportingProvider()]).run()

        expect(calls).toEqual([])
        expect(running.container.bound("reporting")).toBe(false)
    })

    test("boots on first resolution of a provided identifier", () => {
        stubWindow()
        const calls: string[] = []

        class ReportingProvider extends DeferrableServiceProvider {
            provides() {
                return ["reporting"]
            }

            register(container: import("@/container/contract").Container) {
                calls.push("register")
                container.singleton("reporting", Reporting)
            }

            boot() {
                calls.push("boot")
            }
        }

        const running = Application.configure("./").withProviders([new ReportingProvider()]).run()

        const reporting = running.container.make<Reporting>("reporting")

        expect(calls).toEqual(["register", "boot"])
        expect(reporting).toBeInstanceOf(Reporting)
    })

    test("boots only once even when multiple provided identifiers are resolved", () => {
        stubWindow()
        let bootCount = 0

        class ReportingProvider extends DeferrableServiceProvider {
            provides() {
                return ["reporting", "reporting.exporter"]
            }

            register(container: import("@/container/contract").Container) {
                container.singleton("reporting", Reporting)
                container.instance("reporting.exporter", { export: () => {} })
            }

            boot() {
                bootCount += 1
            }
        }

        const running = Application.configure("./").withProviders([new ReportingProvider()]).run()

        running.container.make("reporting")
        running.container.make("reporting.exporter")
        running.container.make("reporting")

        expect(bootCount).toBe(1)
    })

    test("resolving via container.get() also triggers deferred boot", () => {
        stubWindow()
        let booted = false

        class ReportingProvider extends DeferrableServiceProvider {
            provides() {
                return ["reporting"]
            }

            register(container: import("@/container/contract").Container) {
                container.singleton("reporting", Reporting)
            }

            boot() {
                booted = true
            }
        }

        const running = Application.configure("./").withProviders([new ReportingProvider()]).run()

        running.container.get("reporting")

        expect(booted).toBe(true)
    })

    test("supports class identifiers, not just strings", () => {
        stubWindow()
        let booted = false

        class ReportingProvider extends DeferrableServiceProvider {
            provides() {
                return [Reporting]
            }

            register(container: import("@/container/contract").Container) {
                container.singleton(Reporting, Reporting)
            }

            boot() {
                booted = true
            }
        }

        const running = Application.configure("./").withProviders([new ReportingProvider()]).run()

        const reporting = running.container.make(Reporting)

        expect(booted).toBe(true)
        expect(reporting.connected).toBe(false)
        reporting.connect()
        expect(reporting.connected).toBe(true)
    })

    test("an empty provides() list boots eagerly — there's nothing to defer on", () => {
        stubWindow()
        const calls: string[] = []

        class UndeclaredProvider extends DeferrableServiceProvider {
            // provides() left as the default empty array
            register(container: import("@/container/contract").Container) {
                calls.push("register")
                container.singleton("undeclared", Reporting)
            }

            boot() {
                calls.push("boot")
            }
        }

        Application.configure("./").withProviders([new UndeclaredProvider()]).run()

        expect(calls).toEqual(["register", "boot"])
    })

    test("destroy() does not run for a provider that was never triggered", () => {
        let destroyed = false
        let beforeUnload: (() => void) | undefined

        ;(globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } }).window = {
            addEventListener: (_event, cb) => {
                beforeUnload = cb
            },
        }

        class ReportingProvider extends DeferrableServiceProvider {
            provides() {
                return ["reporting"]
            }

            register(container: import("@/container/contract").Container) {
                container.singleton("reporting", Reporting)
            }

            destroy() {
                destroyed = true
            }
        }

        Application.configure("./").withProviders([new ReportingProvider()]).run()

        expect(() => beforeUnload?.()).not.toThrow()
        expect(destroyed).toBe(false)
    })

    test("destroy() does run for a deferred provider that was triggered before shutdown", () => {
        let destroyed = false
        let beforeUnload: (() => void) | undefined

        ;(globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } }).window = {
            addEventListener: (_event, cb) => {
                beforeUnload = cb
            },
        }

        class ReportingProvider extends DeferrableServiceProvider {
            provides() {
                return ["reporting"]
            }

            register(container: import("@/container/contract").Container) {
                container.singleton("reporting", Reporting)
            }

            destroy() {
                destroyed = true
            }
        }

        const running = Application.configure("./").withProviders([new ReportingProvider()]).run()
        running.container.make("reporting")

        beforeUnload?.()

        expect(destroyed).toBe(true)
    })

    test("destroy() runs in reverse boot order — a deferred provider triggered mid-session destroys before earlier eager providers", () => {
        let beforeUnload: (() => void) | undefined
        ;(globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } }).window = {
            addEventListener: (_event, cb) => {
                beforeUnload = cb
            },
        }

        const order: string[] = []

        class EagerProvider extends ServiceProvider {
            destroy() {
                order.push("eager")
            }
        }

        class ReportingProvider extends DeferrableServiceProvider {
            provides() {
                return ["reporting"]
            }

            register(container: import("@/container/contract").Container) {
                container.singleton("reporting", Reporting)
            }

            destroy() {
                order.push("deferred")
            }
        }

        const running = Application.configure("./").withProviders([new EagerProvider(), new ReportingProvider()]).run()

        // Trigger the deferred provider well after the eager ones already booted.
        running.container.make("reporting")

        beforeUnload?.()

        // Deferred booted last (at trigger time), so it's torn down first.
        expect(order).toEqual(["deferred", "eager"])
    })
})
