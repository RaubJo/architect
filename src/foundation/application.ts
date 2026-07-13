import { createConfig } from "../config/discovery"
import { registerGlobalEnv } from "../config/env"
import { ConfigProvider } from "../config/provider"
import type ConfigRepository from "../config/repository"
import type { ConfigItems } from "../config/repository"
import type { Container as Contract, Identifier } from "../container/contract"
import { createRuntimeContainer, mergeRuntimeOptions, type RuntimeOptions } from "../container/runtime"
import type ServiceProvider from "../support/service-provider"
import type { Cleanup } from "../support/service-provider"

let current: Contract | null = null

export function setContainer(container: Contract | null): void {
    current = container
}

export function getContainer(): Contract | null {
    return current
}

export function make<T>(identifier: Identifier<T>): T {
    const container = getContainer()
    if (!container) {
        throw new Error("Application container is not available. Call run() first.")
    }

    return container.make<T>(identifier)
}

type ApplicationRunContext = {
    container: Contract
    cleanupTasks: Cleanup[]
}

export type ApplicationConfigureOptions = {
    basePath?: string
    container?: RuntimeOptions
    config?: ConfigItems
}

type ApplicationResolvedOptions = {
    basePath: string
    container: ReturnType<typeof mergeRuntimeOptions>
    config: ConfigItems
}

registerGlobalEnv()

function mergeConfigureOptions(options: ApplicationConfigureOptions = {}): ApplicationResolvedOptions {
    return {
        basePath: options.basePath ?? "./",
        container: mergeRuntimeOptions(options.container),
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

    static make<T>(identifier: Identifier<T>): T {
        return make<T>(identifier)
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

            container.flush()

            if (getContainer() === container) {
                setContainer(null)
            }
        }

        return stop
    }

    run() {
        const container = this.createContainer()

        setContainer(container)
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
