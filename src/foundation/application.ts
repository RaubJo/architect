import { createConfig } from "../config/discovery"
import { registerGlobalEnv } from "../config/env"
import { ConfigProvider } from "../config/provider"
import type ConfigRepository from "../config/repository"
import type { ConfigItems } from "../config/repository"
import type { Container as Contract, ContainerIdentifier } from "../container/contract"
import {
    type ContainerRuntimeOptions,
    createRuntimeContainer,
    mergeContainerRuntimeOptions,
} from "../container/runtime"
import { clearFacadeCache } from "../support/facades/facade"
import type ServiceProvider from "../support/service-provider"
import type { Cleanup } from "../support/service-provider"
import { getCurrentApplicationContainer, setCurrentApplicationContainer } from "./current-application"

type ApplicationRunContext = {
    container: Contract
    cleanupTasks: Cleanup[]
}

export type ApplicationConfigureOptions = {
    basePath?: string
    container?: ContainerRuntimeOptions
    config?: ConfigItems
}

type ApplicationResolvedOptions = {
    basePath: string
    container: ReturnType<typeof mergeContainerRuntimeOptions>
    config: ConfigItems
}

registerGlobalEnv()

function mergeConfigureOptions(options: ApplicationConfigureOptions = {}): ApplicationResolvedOptions {
    return {
        basePath: options.basePath ?? "./",
        container: mergeContainerRuntimeOptions(options.container),
        config: options.config ?? {},
    }
}

export class Application {
    protected providers: ServiceProvider[]
    protected options: ApplicationResolvedOptions

    constructor(options: ApplicationResolvedOptions) {
        this.options = options
        this.providers = []
    }

    protected getConfigItems(): ConfigRepository {
        return createConfig(this.options.basePath, this.options.config)
    }

    static configure(basePath?: string): Application
    static configure(options?: ApplicationConfigureOptions): Application
    static configure(basePathOrOptions: string | ApplicationConfigureOptions = "./") {
        if (typeof basePathOrOptions === "string") {
            return new Application(mergeConfigureOptions({ basePath: basePathOrOptions }))
        }

        return new Application(mergeConfigureOptions(basePathOrOptions))
    }

    static make<T>(identifier: ContainerIdentifier<T>): T {
        const container = getCurrentApplicationContainer()
        if (!container) {
            throw new Error("Application container is not available. Call run() first.")
        }

        return container.make<T>(identifier)
    }

    withProviders(providers: ServiceProvider[]) {
        this.providers.push(...providers)
        return this
    }

    protected createContainer(): Contract {
        return createRuntimeContainer(this.options.container)
    }

    protected rememberCleanup(cleanupTasks: Cleanup[], cleanup: void | Cleanup): void {
        if (typeof cleanup === "function") {
            cleanupTasks.push(cleanup)
        }
    }

    protected createStopHandler(container: Contract, cleanupTasks: Cleanup[]): Cleanup {
        const stop: Cleanup = () => {
            for (const cleanup of cleanupTasks.reverse()) {
                cleanup()
            }

            clearFacadeCache()

            container.flush()

            if (getCurrentApplicationContainer() === container) {
                setCurrentApplicationContainer(null)
            }
        }

        return stop
    }

    run() {
        const container = this.createContainer()

        setCurrentApplicationContainer(container)
        clearFacadeCache()
        container.instance("app", container)

        const providers = [new ConfigProvider(this.getConfigItems()), ...this.providers]
        const context: ApplicationRunContext = { container, cleanupTasks: [] }

        for (const provider of providers) {
            this.rememberCleanup(context.cleanupTasks, provider.register(context.container))
        }

        for (const provider of providers) {
            this.rememberCleanup(context.cleanupTasks, provider.boot(context.container))
        }

        const stop = this.createStopHandler(container, context.cleanupTasks)

        window.addEventListener("beforeunload", stop, { once: true })

        return {
            container,
            stop,
        }
    }
}
