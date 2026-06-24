import type { ConfigItems } from "../config/repository"
import type { ContainerRuntimeOptions } from "../container/runtime"
import { mergeContainerRuntimeOptions } from "../container/runtime"

type ApplicationConfigureOptions = {
    basePath?: string
    container?: ContainerRuntimeOptions
    config?: ConfigItems
}

function mergeConfigureOptions(options: ApplicationConfigureOptions = {}) {
    return {
        basePath: options.basePath ?? "./",
        container: mergeContainerRuntimeOptions(options.container),
        config: options.config ?? {},
    }
}

export const applicationTestingHelpers = { mergeConfigureOptions }
