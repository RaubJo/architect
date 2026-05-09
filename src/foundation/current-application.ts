import type { ContainerContract, ContainerIdentifier } from "../container/contract"

let currentContainer: ContainerContract | null = null

export function setCurrentApplicationContainer(container: ContainerContract | null): void {
    currentContainer = container
}

export function getCurrentApplicationContainer(): ContainerContract | null {
    return currentContainer
}

export function makeFromCurrentApplication<T>(identifier: ContainerIdentifier<T>): T {
    const container = getCurrentApplicationContainer()
    if (!container) {
        throw new Error("Application container is not available. Call run() first.")
    }

    return container.make<T>(identifier)
}
