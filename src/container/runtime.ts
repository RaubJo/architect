import BuiltinContainer from "./adapters/builtin"
import type { Container } from "./contract"

export type RuntimeOptions = {
    factory: (() => Container) | null
}

export function mergeRuntimeOptions(options: Partial<RuntimeOptions> = {}): RuntimeOptions {
    return {
        factory: options.factory ?? null,
    }
}

export function createRuntimeContainer(options: RuntimeOptions): Container {
    if (typeof options.factory === "function") {
        return options.factory()
    }

    return new BuiltinContainer()
}
