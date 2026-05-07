import type {
    ContainerContract,
    ContainerIdentifier,
} from "../container/contract";

let currentContainer: ContainerContract | null = null;
let legacyContainerReader: (() => ContainerContract | null) | null = null;

export function setLegacyApplicationContainerReader(
    reader: () => ContainerContract | null,
): void {
    legacyContainerReader = reader;
}

export function setCurrentApplicationContainer(
    container: ContainerContract | null,
): void {
    currentContainer = container;
}

export function getCurrentApplicationContainer(): ContainerContract | null {
    return legacyContainerReader?.() ?? currentContainer;
}

export function makeFromCurrentApplication<T>(
    identifier: ContainerIdentifier<T>,
): T {
    const container = getCurrentApplicationContainer();
    if (!container) {
        throw new Error(
            "Application container is not available. Call run() first.",
        );
    }

    return container.make<T>(identifier);
}
