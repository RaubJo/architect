import BuiltinContainer from "./adapters/builtin"
import type { Container } from "./contract"

export type ContainerRuntimeOptions = {
    factory?: (() => Container) | null
}

export type ResolvedContainerRuntimeOptions = {
    factory: (() => Container) | null
}

export function mergeContainerRuntimeOptions(options: ContainerRuntimeOptions = {}): ResolvedContainerRuntimeOptions {
    return {
        factory: options.factory ?? null,
    }
}

export function createRuntimeContainer(options: ResolvedContainerRuntimeOptions): Container {
    if (typeof options.factory === "function") {
        return options.factory()
    }

    return new BuiltinContainer()
}
