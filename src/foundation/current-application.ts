import type { Container, Identifier } from "../container/contract"

let currentContainer: Container | null = null

export function setCurrentApplicationContainer(container: Container | null): void {
    currentContainer = container
}

export function getCurrentApplicationContainer(): Container | null {
    return currentContainer
}

export function makeFromCurrentApplication<T>(identifier: Identifier<T>): T {
    const container = getCurrentApplicationContainer()
    if (!container) {
        throw new Error("Application container is not available. Call run() first.")
    }

    return container.make<T>(identifier)
}
