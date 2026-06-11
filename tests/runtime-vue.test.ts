import { beforeAll, describe, expect, mock, test } from "bun:test"
import BuiltinContainer from "@/container/adapters/builtin"
import type { ContainerIdentifier } from "@/container/contract"

const vueState = {
    injectedContainer: null as BuiltinContainer | null,
    provided: null as { key: unknown; value: unknown } | null,
    mountedTarget: null as unknown,
    mountedComponent: null as unknown,
    unmounted: 0,
}

mock.module("vue", () => ({
    defineComponent: (component: unknown) => component,
    h: (component: unknown) => component,
    inject: (_key: unknown, defaultValue: unknown) => vueState.injectedContainer ?? defaultValue,
    onUnmounted: () => undefined,
    provide: () => undefined,
    createApp: (component: unknown) => {
        vueState.mountedComponent = component
        return {
            provide: (key: unknown, value: unknown) => {
                vueState.provided = { key, value }
            },
            mount: (target: unknown) => {
                vueState.mountedTarget = target
            },
            unmount: () => {
                vueState.unmounted += 1
            },
        }
    },
}))

let useService: <T>(identifier: ContainerIdentifier<T>) => T
let containerKey: symbol
let ContextProvider: { setup: (props: Record<string, unknown>, ctx: { slots: Record<string, unknown> }) => unknown }
let VueRenderer: new () => {
    render: (context: { RootComponent: unknown; container: BuiltinContainer; rootElementId: string }) => () => void
}

beforeAll(async () => {
    const runtime = await import("@/runtimes/vue")
    useService = runtime.useService
    containerKey = runtime.containerKey
    ContextProvider = runtime.ContextProvider as typeof ContextProvider

    const renderer = await import("@/renderers/adapters/vue")
    VueRenderer = renderer.default
})

describe("Vue runtime and renderer", () => {
    test("useService resolves from injected container", () => {
        const container = new BuiltinContainer()
        const token = Symbol("token")
        container.bind(token).toConstantValue("resolved")
        vueState.injectedContainer = container

        expect(useService<string>(token)).toBe("resolved")
    })

    test("useService throws when container is missing", () => {
        vueState.injectedContainer = null

        expect(() => useService("missing")).toThrow("Application container is not available in Vue context.")
    })

    test("renderer throws when mount node is missing", () => {
        ;(globalThis as { document: { getElementById: (id: string) => null } }).document = {
            getElementById: () => null,
        }

        const renderer = new VueRenderer()
        expect(() =>
            renderer.render({
                RootComponent: {},
                container: new BuiltinContainer(),
                rootElementId: "root",
            }),
        ).toThrow("Missing mount node #root.")
    })

    test("ContextProvider setup throws when neither application nor container is provided", () => {
        expect(() => ContextProvider.setup({}, { slots: {} })).toThrow(
            "ContextProvider requires either `application` or `container`.",
        )
    })

    test("ContextProvider setup with container returns a render function", () => {
        const container = new BuiltinContainer()
        const result = ContextProvider.setup({ container }, { slots: {} })
        expect(typeof result).toBe("function")
    })

    test("ContextProvider setup with application calls run() and returns render function", () => {
        const container = new BuiltinContainer()
        let ran = false
        const fakeApp = {
            run: () => {
                ran = true
                return { container, stop: () => {} }
            },
        }
        const result = ContextProvider.setup({ application: fakeApp }, { slots: {} })
        expect(ran).toBe(true)
        expect(typeof result).toBe("function")
    })

    test("renderer provides container, mounts, and unmounts", () => {
        const mountNode = {}
        vueState.provided = null
        vueState.mountedTarget = null
        vueState.mountedComponent = null
        vueState.unmounted = 0

        ;(globalThis as { document: { getElementById: (id: string) => object | null } }).document = {
            getElementById: () => mountNode,
        }

        const RootComponent = { name: "RootComponent" }
        const container = new BuiltinContainer()
        const renderer = new VueRenderer()

        const cleanup = renderer.render({
            RootComponent,
            container,
            rootElementId: "root",
        })

        expect(vueState.mountedComponent).toBe(RootComponent)
        expect(vueState.mountedTarget).toBe(mountNode)
        expect(vueState.provided as { key: unknown; value: unknown } | null).toEqual({
            key: containerKey,
            value: container,
        })

        cleanup()
        expect(vueState.unmounted).toBe(1)
    })
})
