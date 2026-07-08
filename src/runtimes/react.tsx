import {
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from "react"
import type { Container, ContainerIdentifier } from "../container/contract"
import type { Application } from "../foundation/application"
import type { Signal } from "../support/signal"

const Context = createContext<Container | null>(null)

type ApplicationProviderProps = {
    container: Container
    children?: ReactNode
}

export function ApplicationProvider({ container, children }: ApplicationProviderProps) {
    return <Context.Provider value={container}>{children}</Context.Provider>
}

export type ContextProviderProps = {
    application?: Application
    container?: Container
    fallback?: ReactNode
    children?: ReactNode
}

export function ContextProvider({ application, container, fallback = null, children }: ContextProviderProps) {
    if (!application && !container) {
        throw new Error("ContextProvider requires either `application` or `container`.")
    }

    const externalRuntime = useMemo(() => (container ? { container, stop: () => {} } : null), [container])
    const [runtime, setRuntime] = useState<{ container: Container; stop: () => void } | null>(externalRuntime)

    const stopRef = useRef<null | (() => void)>(null)
    const startedRef = useRef(false)

    useEffect(() => {
        if (externalRuntime) {
            setRuntime(externalRuntime)
            return
        }

        if (startedRef.current) {
            return
        }

        startedRef.current = true

        const running = application?.run()
        stopRef.current = running.stop
        setRuntime(running)

        return () => {
            stopRef.current?.()
            stopRef.current = null
            startedRef.current = false
            setRuntime(null)
        }
    }, [application, externalRuntime])

    if (!runtime) {
        return <>{fallback}</>
    }

    return <ApplicationProvider container={runtime.container}>{children}</ApplicationProvider>
}

export function useService<T>(identifier: ContainerIdentifier<T>): T {
    const container = useContext(Context)
    if (!container) {
        throw new Error("You must use `useService` inside the Application Context.")
    }

    return container.make<T>(identifier)
}

export function useContainer(): Container {
    const container = useContext(Context)
    if (!container) {
        throw new Error("You must use `useContainer` inside the Application Context.")
    }

    return container
}

export function useSignal<T>(signal: Signal<T>): T {
    return useSyncExternalStore(
        (onChange) => signal.subscribe(onChange),
        () => signal.get(),
    )
}
