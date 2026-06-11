import { beforeAll, describe, expect, mock, test } from "bun:test"
import BuiltinContainer from "@/container/adapters/builtin"
import type { ContainerIdentifier } from "@/container/contract"

const reactContextValues = new Map<object, unknown>()
let forcedReactContextValue: unknown
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
        if (typeof forcedReactContextValue !== "undefined") {
            return forcedReactContextValue as T
        }
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
    useEffect(callback: () => void | (() => void)) {
        callback()
    },
    useMemo<T>(factory: () => T) {
        return factory()
    },
    useRef<T>(value: T) {
        return { current: value }
    },
    useState<T>(value: T) {
        return [value, () => undefined] as const
    },
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

let ApplicationProvider: (props: { container: BuiltinContainer; children?: unknown }) => unknown
let ContextProvider: (props: {
    application?: { run: () => { container: BuiltinContainer; stop: () => void } }
    container?: BuiltinContainer
    fallback?: unknown
    children?: unknown
}) => unknown
let useService: <T>(identifier: ContainerIdentifier<T>) => T
let useContainer: () => BuiltinContainer

describe("React runtime", () => {
    beforeAll(async () => {
        const runtime = await import("@/runtimes/react")
        ApplicationProvider = runtime.ApplicationProvider as (props: {
            container: BuiltinContainer
            children?: unknown
        }) => unknown
        ContextProvider = runtime.ContextProvider as typeof ContextProvider
        useService = runtime.useService
        useContainer = runtime.useContainer as typeof useContainer
    })

    test("ApplicationProvider + useService resolves from container", () => {
        const container = new BuiltinContainer()
        const token = Symbol("token")
        container.bind(token).toConstantValue("resolved")

        ApplicationProvider({ container, children: null })
        forcedReactContextValue = container
        expect(useService<string>(token)).toBe("resolved")
        forcedReactContextValue = undefined
    })

    test("useService throws when provider is missing", () => {
        forcedReactContextValue = undefined
        reactContextValues.clear()
        expect(() => useService("missing")).toThrow("You must use `useService` inside the Application Context.")
    })

    test("ContextProvider with container prop does not throw", () => {
        const container = new BuiltinContainer()
        expect(() => ContextProvider({ container, children: "child" })).not.toThrow()
    })

    test("ContextProvider throws when neither application nor container is provided", () => {
        expect(() => ContextProvider({})).toThrow("ContextProvider requires either `application` or `container`.")
    })

    test("ContextProvider with application calls application.run() in effect", () => {
        let ran = false
        const innerContainer = new BuiltinContainer()
        const fakeApp = {
            run: () => {
                ran = true
                return { container: innerContainer, stop: () => {} }
            },
        }
        // useEffect mock calls callback synchronously; useState is a no-op setter so runtime stays null → fallback rendered
        reactContextValues.clear()
        ContextProvider({ application: fakeApp, fallback: "loading" })
        expect(ran).toBe(true)
    })

    test("useContainer returns the current container", () => {
        const container = new BuiltinContainer()
        forcedReactContextValue = container
        expect(useContainer()).toBe(container)
        forcedReactContextValue = undefined
    })

    test("useContainer throws when outside application context", () => {
        forcedReactContextValue = undefined
        reactContextValues.clear()
        expect(() => useContainer()).toThrow("You must use `useContainer` inside the Application Context.")
    })
})
