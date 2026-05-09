import { describe, expect, test } from "bun:test"
import BuiltinContainer from "@/container/adapters/builtin"
import ServiceProvider, { DeferrableServiceProvider } from "@/support/service-provider"

describe("ServiceProvider base classes", () => {
    test("default register and boot are no-ops", () => {
        const provider = new ServiceProvider()
        const container = new BuiltinContainer()

        expect(provider.register({ container })).toBeUndefined()
        expect(provider.boot({ container })).toBeUndefined()
    })

    test("deferrable provider default provides list is empty", () => {
        const provider = new DeferrableServiceProvider()
        const container = new BuiltinContainer()
        expect(provider.register({ container })).toBeUndefined()
        expect(provider.boot({ container })).toBeUndefined()
        expect(provider.provides()).toEqual([])
    })
})
