import CacheManager from "@/cache/manager";
import { cloneConfigItems } from "@/config/clone";
import { registerGlobalEnv } from "@/config/env";
import ConfigRepository, { type ConfigItems } from "@/config/repository";
import type {
    ContainerContract,
    ContainerIdentifier,
} from "@/container/contract";
import {
    createRuntimeContainer,
    mergeContainerRuntimeOptions,
    type ContainerRuntimeOptions,
} from "@/container/runtime";
import type Contract from "@/renderers/contract";
import type { RootComponent } from "@/renderers/contract";
import StorageManager from "@/storage/manager";
import ServiceProvider, {
    type Cleanup,
    type ServiceProviderContext,
} from "@/support/service-provider";
import { registerGlobalStr } from "@/support/str";
import Facade from "@/support/facades/facade";

type StartupHandler = (context: ServiceProviderContext) => void | Cleanup;
type ServiceRegistrar = (context: ServiceProviderContext) => void | Cleanup;

export type ApplicationConfigureOptions = {
    basePath?: string;
    container?: ContainerRuntimeOptions;
    config?: ConfigItems;
};

type ApplicationResolvedOptions = {
    basePath: string;
    container: ReturnType<typeof mergeContainerRuntimeOptions>;
    config: ConfigItems;
};

registerGlobalEnv();
registerGlobalStr();

function mergeConfigureOptions(
    options: ApplicationConfigureOptions = {},
): ApplicationResolvedOptions {
    return {
        basePath: options.basePath ?? "./",
        container: mergeContainerRuntimeOptions(options.container),
        config: options.config ?? {},
    };
}

export class Application {
    protected static container: ContainerContract | null = null;

    protected providers: ServiceProvider[];
    protected serviceRegistrars: ServiceRegistrar[];
    protected startupHandlers: StartupHandler[];
    protected rootElementId: string;
    protected RootComponent: RootComponent | null;
    protected renderer: Contract | null;
    protected options: ApplicationResolvedOptions;

    constructor(options: ApplicationResolvedOptions) {
        this.options = options;
        this.providers = this.getDefaultProviders();
        this.serviceRegistrars = [];
        this.startupHandlers = [];
        this.rootElementId = "root";
        this.RootComponent = null;
        this.renderer = null;
    }

    protected getDefaultProviders(): ServiceProvider[] {
        return [];
    }

    protected getConfigItems(): ConfigItems {
        // Give each application instance its own mutable repository data.
        return cloneConfigItems(this.options.config);
    }

    static clearConfigCache(_basePath?: string): void {}

    static configure(basePath?: string): Application;
    static configure(options?: ApplicationConfigureOptions): Application;
    static configure(
        basePathOrOptions: string | ApplicationConfigureOptions = "./",
    ) {
        if (typeof basePathOrOptions === "string") {
            return new Application(
                mergeConfigureOptions({ basePath: basePathOrOptions }),
            );
        }

        return new Application(mergeConfigureOptions(basePathOrOptions));
    }

    static make<T>(identifier: ContainerIdentifier<T>): T {
        if (!Application.container) {
            throw new Error(
                "Application container is not available. Call run() first.",
            );
        }

        return Application.container.make<T>(identifier);
    }

    withProviders(providers: ServiceProvider[]) {
        this.providers.push(...providers);
        return this;
    }

    withServices(registerServices: ServiceRegistrar) {
        this.serviceRegistrars.push(registerServices);
        return this;
    }

    withStartup(startupHandler: StartupHandler) {
        this.startupHandlers.push(startupHandler);
        return this;
    }

    withRoot(
        RootComponent: RootComponent,
        options: { rootElementId?: string } = {},
    ) {
        this.RootComponent = RootComponent;
        this.rootElementId = options.rootElementId ?? this.rootElementId;
        return this;
    }

    withRenderer(renderer: Contract) {
        this.renderer = renderer;
        return this;
    }

    protected createContainer(): ContainerContract {
        return createRuntimeContainer(this.options.container);
    }

    run() {
        const container = this.createContainer();

        Application.container = container;

        Facade.clearResolvedInstances();

        const context = { container };
        const cleanupTasks: Cleanup[] = [];
        const configRepository = new ConfigRepository(this.getConfigItems());
        const storageManager = StorageManager.fromConfig(configRepository);
        const cacheManager = CacheManager.fromConfig(configRepository);

        container.instance("config", configRepository);
        container.instance(ConfigRepository, configRepository);
        container.instance("storage", storageManager);
        container.instance(StorageManager, storageManager);
        container.instance("cache", cacheManager);
        container.instance(CacheManager, cacheManager);

        for (const provider of this.providers) {
            if (typeof provider.register === "function") {
                const cleanup = provider.register(context);
                if (typeof cleanup === "function") {
                    cleanupTasks.push(cleanup);
                }
            }
        }

        for (const registerServices of this.serviceRegistrars) {
            const cleanup = registerServices(context);
            if (typeof cleanup === "function") {
                cleanupTasks.push(cleanup);
            }
        }

        for (const provider of this.providers) {
            if (typeof provider.boot === "function") {
                const cleanup = provider.boot(context);
                if (typeof cleanup === "function") {
                    cleanupTasks.push(cleanup);
                }
            }
        }

        for (const startupHandler of this.startupHandlers) {
            const cleanup = startupHandler(context);
            if (typeof cleanup === "function") {
                cleanupTasks.push(cleanup);
            }
        }

        let rendererCleanup: Cleanup = () => {};

        if (this.renderer) {
            if (!this.RootComponent) {
                throw new Error(
                    "Root component is required when using a custom renderer.",
                );
            }

            rendererCleanup =
                this.renderer.render({
                    ...context,
                    RootComponent: this.RootComponent,
                    rootElementId: this.rootElementId,
                }) ?? rendererCleanup;
        } else if (this.RootComponent) {
            throw new Error(
                "Renderer is required when root component is set. Install a renderer feature (react/solid/svelte/vue) and call withRenderer(...).",
            );
        }

        const stop: Cleanup = () => {
            rendererCleanup();

            for (const cleanup of cleanupTasks.reverse()) {
                cleanup();
            }

            Facade.clearResolvedInstances();

            container.flush();

            if (Application.container === container) {
                Application.container = null;
            }
        };

        window.addEventListener("beforeunload", stop, { once: true });

        return {
            container,
            stop,
        };
    }
}
