import BuiltinContainer from "./adapters/builtin"
import type { Container } from "./contract"

export type ContainerAdapter = "builtin"

export type ContainerRuntimeOptions = {
    adapter?: ContainerAdapter
    factory?: (() => Container) | null
}

export type ResolvedContainerRuntimeOptions = {
    adapter: ContainerAdapter
    factory: (() => Container) | null
}

export function mergeContainerRuntimeOptions(options: ContainerRuntimeOptions = {}): ResolvedContainerRuntimeOptions {
    return {
        adapter: options.adapter ?? "builtin",
        factory: options.factory ?? null,
    }
}

export function createRuntimeContainer(options: ResolvedContainerRuntimeOptions): Container {
    if (typeof options.factory === "function") {
        return options.factory()
    }

    return new BuiltinContainer()
}
