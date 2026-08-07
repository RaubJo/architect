import { createConfig } from "../config/discovery"
import { registerGlobalEnv } from "../config/env"
import { ConfigProvider } from "../config/provider"
import type ConfigRepository from "../config/repository"
import type { ConfigItems } from "../config/repository"
import type { Container as Contract, Identifier } from "../container/contract"
import { createRuntimeContainer, mergeRuntimeOptions, type RuntimeOptions } from "../container/runtime"
import ServiceProvider, { type Cleanup, DeferrableServiceProvider } from "../support/service-provider"

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
    providers: ServiceProvider[]
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

function isClass(value: unknown): value is new () => unknown {
    return typeof value === "function" && /^class\s/.test(Function.prototype.toString.call(value))
}

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

    use(provider: ServiceProvider | (new () => ServiceProvider)): this
    use(config: ConfigItems): this
    use(value: ServiceProvider | (new () => ServiceProvider) | ConfigItems) {
        if (typeof value === "function") {
            if (!isClass(value)) {
                throw new Error(
                    "Application.use() cannot accept a plain function; pass a class, an instance, or a config object.",
                )
            }

            const resolved = new value()

            if (resolved instanceof ServiceProvider) {
                this.providers.push(resolved)
                return this
            }

            Object.assign(this.options.config, resolved)
            return this
        }

        if (value instanceof ServiceProvider) {
            this.providers.push(value)
            return this
        }

        Object.assign(this.options.config, value)
        return this
    }

    protected createContainer(): Contract {
        return createRuntimeContainer(this.options.container)
    }

    /**
     * Wires deferred providers so register()/boot() run lazily, once, the first time any of their
     * declared provides() identifiers is resolved — instead of eagerly during run(). Patches the
     * container's own make() (get() already delegates to it) rather than wrapping the container,
     * so there's exactly one resolution/tag-transform pass either way.
     */
    protected installDeferredResolution(container: Contract, providers: ServiceProvider[]): void {
        const pending = new Map<Identifier, DeferrableServiceProvider>()

        for (const provider of providers) {
            if (!(provider instanceof DeferrableServiceProvider)) continue
            for (const identifier of provider.provides()) {
                pending.set(identifier, provider)
            }
        }

        if (pending.size === 0) return

        const originalMake = container.make.bind(container)
        container.make = (<T>(identifier: Identifier<T>): T => {
            const provider = pending.get(identifier)
            if (provider) {
                for (const id of provider.provides()) pending.delete(id)
                provider.register(container)
                provider.boot(container)
            }
            return originalMake(identifier)
        }) as Contract["make"]
    }

    protected createStopHandler(container: Contract, providers: ServiceProvider[]): Cleanup {
        const stop: Cleanup = () => {
            for (const provider of [...providers].reverse()) {
                provider.destroy(container)
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
        const context: ApplicationRunContext = { container, providers }

        const deferred = new Set<ServiceProvider>(
            providers.filter(
                (provider): provider is DeferrableServiceProvider =>
                    provider instanceof DeferrableServiceProvider && provider.provides().length > 0,
            ),
        )

        this.installDeferredResolution(container, providers)

        for (const provider of providers) {
            if (deferred.has(provider)) continue
            provider.register(context.container)
        }

        for (const provider of providers) {
            if (deferred.has(provider)) continue
            provider.boot(context.container)
        }

        const stop = this.createStopHandler(container, context.providers)

        window.addEventListener("beforeunload", stop, { once: true })

        return {
            container,
            stop,
        }
    }
}
