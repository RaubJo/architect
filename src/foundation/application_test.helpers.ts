import type { ConfigItems } from "../config/repository"
import type { RuntimeOptions } from "../container/runtime"
import { mergeRuntimeOptions } from "../container/runtime"

type ApplicationConfigureOptions = {
    basePath?: string
    container?: RuntimeOptions
    config?: ConfigItems
}

function mergeConfigureOptions(options: ApplicationConfigureOptions = {}) {
    return {
        basePath: options.basePath ?? "./",
        container: mergeRuntimeOptions(options.container),
        config: options.config ?? {},
    }
}

export const applicationTestingHelpers = { mergeConfigureOptions }
