import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { ContainerContract, ContainerIdentifier } from "../container/contract"
import type { Application } from "../foundation/application"

const Context = createContext<ContainerContract | null>(null)

type ApplicationProviderProps = {
    container: ContainerContract
    children?: ReactNode
}

export function ApplicationProvider({ container, children }: ApplicationProviderProps) {
    return <Context.Provider value={container}>{children}</Context.Provider>
}

export type ContextProviderProps = {
    application?: Application
    container?: ContainerContract
    fallback?: ReactNode
    children?: ReactNode
}

export function ContextProvider({ application, container, fallback = null, children }: ContextProviderProps) {
    if (!application && !container) {
        throw new Error("ContextProvider requires either `application` or `container`.")
    }

    const externalRuntime = useMemo(() => (container ? { container, stop: () => {} } : null), [container])
    const [runtime, setRuntime] = useState<{ container: ContainerContract; stop: () => void } | null>(externalRuntime)

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

export function useContainer(): ContainerContract {
    const container = useContext(Context)
    if (!container) {
        throw new Error("You must use `useContainer` inside the Application Context.")
    }

    return container
}
