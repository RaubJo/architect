import { createComponent, createContext, type JSX, onCleanup, useContext } from "solid-js"
import type { ContainerContract, ContainerIdentifier } from "../container/contract"
import type { Application } from "../foundation/application"

const ContainerContext = createContext<ContainerContract | null>(null)

type ApplicationProviderProps = {
    container: ContainerContract
    children?: JSX.Element | (() => JSX.Element)
}

export function ApplicationProvider(props: ApplicationProviderProps) {
    return createComponent(ContainerContext.Provider, {
        value: props.container,
        children: props.children as never,
    })
}

export type ContextProviderProps = {
    application?: Application
    container?: ContainerContract
    children?: JSX.Element | (() => JSX.Element)
}

export function ContextProvider(props: ContextProviderProps) {
    if (props.container) {
        return createComponent(ApplicationProvider, { container: props.container, children: props.children as never })
    }

    if (!props.application) {
        throw new Error("ContextProvider requires either `application` or `container`.")
    }

    const runtime = props.application.run()
    onCleanup(() => runtime.stop())

    return createComponent(ApplicationProvider, { container: runtime.container, children: props.children as never })
}

export function useService<T>(identifier: ContainerIdentifier<T>): T {
    const container = useContext(ContainerContext)
    if (!container) {
        throw new Error("Application container is not available in Solid context.")
    }

    return container.make<T>(identifier)
}
