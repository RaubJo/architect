import { afterEach, describe, expect, mock, test } from "bun:test"
import ConfigRepository from "@/config/repository"
import BuiltinContainer from "@/container/adapters/builtin"
import { Application } from "@/foundation/application"
import { applicationTestingHelpers } from "@/foundation/application_test.helpers"
import { makeFromCurrentApplication, setCurrentApplicationContainer } from "@/foundation/current-application"
import { defaultProviders } from "@/index"
import ServiceProvider from "@/support/service-provider"

const reactContextValues = new Map<object, unknown>()
function normalizeChildren(children: unknown[]): unknown {
    if (children.length === 0) {
        return undefined
    }

    return children.length === 1 ? children[0] : children
}

const reactModule = {
    createContext<T>(defaultValue: T) {
        const context = {
            _default: defaultValue,
            Provider: ({ value, children }: { value: unknown; children?: unknown }) => {
                reactContextValues.set(context, value)
                return children ?? null
            },
        }
        return context
    },
    useContext<T>(context: { _default: T }) {
        if (reactContextValues.has(context as object)) {
            return reactContextValues.get(context as object) as T
        }
        return context._default
    },
    createElement(type: unknown, props?: Record<string, unknown>, ...children: unknown[]) {
        if (typeof type === "function") {
            return type({
                ...(props ?? {}),
                children: normalizeChildren(children),
            })
        }
        return { type, props: { ...(props ?? {}), children } }
    },
    useEffect: () => undefined,
    useMemo: <T>(factory: () => T) => factory(),
    useRef: <T>(value: T) => ({ current: value }),
    useState: <T>(value: T) => [value, () => undefined] as const,
}

const reactDomState = {
    rendered: 0,
    unmounted: 0,
    mountNode: undefined as unknown,
}

mock.module("react", () => reactModule)
mock.module("react/jsx-runtime", () => ({
    Fragment: Symbol.for("react.fragment"),
    jsx: (type: unknown, props: Record<string, unknown>) => reactModule.createElement(type, props),
    jsxs: (type: unknown, props: Record<string, unknown>) => reactModule.createElement(type, props),
}))
mock.module("react/jsx-dev-runtime", () => ({
    Fragment: Symbol.for("react.fragment"),
    jsxDEV: (type: unknown, props: Record<string, unknown>) => reactModule.createElement(type, props),
}))
mock.module("react-dom/client", () => ({
    default: {
        createRoot: (node: unknown) => {
            reactDomState.mountNode = node
            return {
                render: () => {
                    reactDomState.rendered += 1
                },
                unmount: () => {
                    reactDomState.unmounted += 1
                },
            }
        },
    },
}))

describe("Application", () => {
    afterEach(() => {
        ;(globalThis as { window?: unknown; document?: unknown }).window = undefined
        ;(globalThis as { window?: unknown; document?: unknown }).document = undefined
        ;(globalThis as { __iocConfigGlobForTests?: unknown }).__iocConfigGlobForTests = undefined
        Application.clearConfigCache()
    })

    test("make throws when container is not initialized", () => {
        expect(() => Application.make("config")).toThrow("Application container is not available. Call run() first.")
    })

    test("current application helper throws when container is not initialized", () => {
        setCurrentApplicationContainer(null)

        expect(() => makeFromCurrentApplication("config")).toThrow(
            "Application container is not available. Call run() first.",
        )
    })

    test("run executes lifecycle and cleanup in reverse order", () => {
        const calls: string[] = []
        let beforeUnload: (() => void) | undefined

        ;(globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } }).window = {
            addEventListener: (_event, cb) => {
                beforeUnload = cb
            },
        }

        class DemoProvider extends ServiceProvider {
            register(container: { bind: (id: string) => { toConstantValue: (v: unknown) => void } }) {
                calls.push("provider.register")
                container.bind("demo").toConstantValue("value")
                return () => calls.push("provider.register.cleanup")
            }

            boot() {
                calls.push("provider.boot")
                return () => calls.push("provider.boot.cleanup")
            }
        }

        const _app = Application.configure("./")
            .withProviders([...defaultProviders, new DemoProvider()])
            .run()

        expect(Application.make<string>("demo")).toBe("value")
        expect(Application.make("store")).toBeTruthy()
        expect(Application.make("cache")).toBeTruthy()
        expect(calls).toEqual(["provider.register", "provider.boot"])

        expect(typeof beforeUnload).toBe("function")
        beforeUnload?.()

        expect(calls).toEqual([
            "provider.register",
            "provider.boot",
            "provider.boot.cleanup",
            "provider.register.cleanup",
        ])

        expect(() => Application.make("demo")).toThrow("Application container is not available. Call run() first.")
    })

    test("exposes helper behavior used for config discovery", () => {
        expect(applicationTestingHelpers.fileNameWithoutExtension("/src/config/app.ts")).toBe("app")
        expect(applicationTestingHelpers.normalizeBasePath("./")).toBe("")
        expect(applicationTestingHelpers.normalizeBasePath("./src")).toBe("src")
        expect(applicationTestingHelpers.isPathInConfigDirectories("/src/config/app.ts", "./")).toBe(true)
        expect(applicationTestingHelpers.isPathInConfigDirectories("/workspace/src/config/app.ts", "/workspace")).toBe(
            true,
        )
    })

    test("does not load config modules implicitly", () => {
        ;(
            globalThis as {
                __iocConfigGlobForTests?: (
                    pattern: string | string[],
                    options?: { eager?: boolean },
                ) => Record<string, unknown>
            }
        ).__iocConfigGlobForTests = () => ({
            "/src/config/app.ts": { default: { name: "From App Config" } },
            "/src/config/cache.ts": { default: { store: "memory" } },
            "/other/path/ignored.ts": { default: { nope: true } },
        })

        ;(globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } }).window = {
            addEventListener: () => {},
        }

        const first = Application.configure({
            basePath: "./src",
            config: {
                cache: { store: "memory" },
            },
        }).run()
        const second = Application.configure({
            basePath: "./src",
            config: {
                cache: { store: "memory" },
            },
        }).run()

        const firstConfig = first.container.get(ConfigRepository)
        const secondConfig = second.container.get(ConfigRepository)

        expect(firstConfig.get("app")).toBeNull()
        expect(firstConfig.get<{ store: string }>("cache")).toEqual({ store: "memory" })
        expect(firstConfig.get("ignored")).toBeNull()
        expect(firstConfig.all()).toEqual(secondConfig.all())
        expect(firstConfig.all()).not.toBe(secondConfig.all())

        // Config passed to configure should be cloned into each app instance.
        firstConfig.set("cache.store", "updated")
        expect(secondConfig.get<string>("cache.store")).toBe("memory")

        first.stop()
        second.stop()
    })

    test("configure supports explicit config object overrides", () => {
        ;(globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } }).window = {
            addEventListener: () => {},
        }

        const running = Application.configure({
            basePath: "./",
            config: {
                app: { name: "From configure()", timezone: "UTC" },
            },
        }).run()

        const config = running.container.get(ConfigRepository)
        expect(config.get<string>("app.name")).toBe("From configure()")
    })

    test("configure options are merged with defaults", () => {
        expect(applicationTestingHelpers.mergeConfigureOptions()).toEqual({
            basePath: "./",
            container: { adapter: "builtin", factory: null },
            config: {},
        })

        expect(
            applicationTestingHelpers.mergeConfigureOptions({
                basePath: "./src",
                container: { adapter: "builtin" },
            }),
        ).toEqual({
            basePath: "./src",
            container: { adapter: "builtin", factory: null },
            config: {},
        })
    })

    test("configure uses builtin container by default", () => {
        ;(globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } }).window = {
            addEventListener: () => {},
        }

        const running = Application.configure({ basePath: "./" }).run()
        expect(running.container).toBeInstanceOf(BuiltinContainer)
    })

    test("configure can use builtin adapter or custom factory", () => {
        ;(globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } }).window = {
            addEventListener: () => {},
        }

        const builtin = Application.configure({
            basePath: "./",
            container: { adapter: "builtin" },
        }).run()
        expect(builtin.container).toBeInstanceOf(BuiltinContainer)

        const custom = Application.configure({
            basePath: "./",
            container: { factory: () => new BuiltinContainer() },
        }).run()
        expect(custom.container).toBeInstanceOf(BuiltinContainer)
    })

    test("react renderer throws if mount node is missing", async () => {
        const { default: ReactRenderer } = await import("@/renderers/adapters/react")

        ;(globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } }).window = {
            addEventListener: () => {},
        }
        ;(globalThis as { document: { getElementById: (id: string) => null } }).document = {
            getElementById: () => null,
        }

        const running = Application.configure("./").run()
        const renderer = new ReactRenderer()

        expect(() =>
            renderer.render({ container: running.container, RootComponent: () => null, rootElementId: "root" }),
        ).toThrow("Missing mount node #root.")
    })

    test("react renderer mounts and unmounts when stopped", async () => {
        const { default: ReactRenderer } = await import("@/renderers/adapters/react")

        let beforeUnload: (() => void) | undefined

        ;(globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } }).window = {
            addEventListener: (_event, cb) => {
                beforeUnload = cb
            },
        }
        ;(globalThis as { document: { getElementById: (id: string) => object | null } }).document = {
            getElementById: () => ({}),
        }

        reactDomState.rendered = 0
        reactDomState.unmounted = 0
        reactDomState.mountNode = undefined

        const running = Application.configure("./").run()
        const renderer = new ReactRenderer()
        const rendererCleanup =
            renderer.render({ container: running.container, RootComponent: () => null, rootElementId: "root" }) ??
            (() => {})
        expect(reactDomState.rendered).toBe(1)
        expect(reactDomState.mountNode).toBeTruthy()
        rendererCleanup()
        running.stop()
        expect(reactDomState.unmounted).toBe(1)
        // Application shutdown is separate from renderer cleanup; a second stop remains a no-op for the renderer.
        beforeUnload?.()
        expect(reactDomState.unmounted).toBe(1)
    })

    test("does not require a renderer", () => {
        ;(globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } }).window = {
            addEventListener: () => {},
        }

        expect(() => Application.configure("./").run()).not.toThrow()
    })
})
