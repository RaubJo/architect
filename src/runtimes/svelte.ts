import { getContext, setContext } from "svelte"
import type { Container, ContainerIdentifier } from "../container/contract"

export const containerKey: unique symbol = Symbol("application.container")

export function provideContainer(container: Container): void {
    setContext(containerKey, container)
}

export function useService<T>(identifier: ContainerIdentifier<T>): T {
    const container = getContext<Container | null>(containerKey) ?? null
    if (!container) {
        throw new Error("Application container is not available in Svelte context.")
    }

    return container.make<T>(identifier)
}
