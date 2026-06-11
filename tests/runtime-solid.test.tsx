import { describe, expect, test } from "bun:test"
import { createComponent } from "solid-js"
import { renderToString } from "solid-js/web/dist/server.js"

import BuiltinContainer from "@/container/adapters/builtin"
import { ApplicationProvider, ContextProvider, useService } from "@/runtimes/solid"

describe("Solid runtime", () => {
    test("ApplicationProvider + useService resolves from container", () => {
        const container = new BuiltinContainer()
        const token = Symbol("token")
        container.bind(token).toConstantValue("resolved")

        function Probe() {
            const value = useService<string>(token)
            return value
        }

        const html = renderToString(() =>
            createComponent(ApplicationProvider, {
                container,
                children: () => createComponent(Probe, {}),
            }),
        )

        expect(html).toContain("resolved")
    })

    test("useService throws when provider is missing", () => {
        function Probe() {
            useService("missing")
            return null
        }

        expect(() => renderToString(() => createComponent(Probe, {}))).toThrow(
            "Application container is not available in Solid context.",
        )
    })

    test("ContextProvider with container prop wraps children in ApplicationProvider", () => {
        const container = new BuiltinContainer()
        const token = Symbol("token")
        container.bind(token).toConstantValue("solid-container")

        function Probe() {
            return useService<string>(token)
        }

        const html = renderToString(() =>
            createComponent(ContextProvider, {
                container,
                children: () => createComponent(Probe, {}),
            }),
        )
        expect(html).toContain("solid-container")
    })

    test("ContextProvider throws when neither application nor container is provided", () => {
        expect(() => renderToString(() => createComponent(ContextProvider, {}))).toThrow(
            "ContextProvider requires either `application` or `container`.",
        )
    })

    test("ContextProvider with application calls run() and renders container", () => {
        const container = new BuiltinContainer()
        const token = Symbol("token")
        container.bind(token).toConstantValue("from-app")
        let ran = false
        const fakeApp = {
            run: () => {
                ran = true
                return { container, stop: () => {} }
            },
        }

        function Probe() {
            return useService<string>(token)
        }

        const html = renderToString(() =>
            createComponent(ContextProvider, {
                application: fakeApp as never,
                children: () => createComponent(Probe, {}),
            }),
        )
        expect(ran).toBe(true)
        expect(html).toContain("from-app")
    })
})
