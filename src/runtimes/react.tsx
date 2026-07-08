import {
    Component,
    createContext,
    type ErrorInfo,
    type ReactNode,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from "react"
import type { Container, ContainerIdentifier } from "../container/contract"
import ArchitectError from "../errors/error"
import type { Bus } from "../events/bus"
import type { Application } from "../foundation/application"
import type { Signal } from "../support/signal"

const Context = createContext<Container | null>(null)

export type ErrorBoundaryProps = {
    fallback?: ReactNode | ((error: unknown) => ReactNode)
    children?: ReactNode
}

type ErrorBoundaryState = { failed: boolean; error: unknown }

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    static contextType = Context
    declare context: Container | null

    state: ErrorBoundaryState = { failed: false, error: null }

    static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
        return { failed: true, error }
    }

    componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
        if (this.context?.bound("events")) {
            void this.context.make<Bus>("events").dispatch(new ArchitectError(error, "react", errorInfo))
        }
    }

    render() {
        if (this.state.failed) {
            const { fallback } = this.props
            return typeof fallback === "function" ? fallback(this.state.error) : (fallback ?? null)
        }

        return this.props.children
    }
}

type ApplicationProviderProps = {
    container: Container
    errorFallback?: ErrorBoundaryProps["fallback"]
    children?: ReactNode
}

export function ApplicationProvider({ container, errorFallback, children }: ApplicationProviderProps) {
    return (
        <Context.Provider value={container}>
            <ErrorBoundary fallback={errorFallback}>{children}</ErrorBoundary>
        </Context.Provider>
    )
}

export type ContextProviderProps = {
    application?: Application
    container?: Container
    fallback?: ReactNode
    errorFallback?: ErrorBoundaryProps["fallback"]
    children?: ReactNode
}

export function ContextProvider({
    application,
    container,
    fallback = null,
    errorFallback,
    children,
}: ContextProviderProps) {
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

        if (startedRef.current || !application) {
            return
        }

        startedRef.current = true

        const running = application.run()
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

    return (
        <ApplicationProvider container={runtime.container} errorFallback={errorFallback}>
            {children}
        </ApplicationProvider>
    )
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
