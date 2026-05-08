import CacheManager from "../cache/manager";
import { registerGlobalEnv } from "../config/env";
import ConfigRepository, { type ConfigItems } from "../config/repository";
import { createConfig } from "../config/discovery";
import type {
    ContainerContract,
    ContainerIdentifier,
} from "../container/contract";
import {
    createRuntimeContainer,
    mergeContainerRuntimeOptions,
    type ContainerRuntimeOptions,
} from "../container/runtime";
import type Contract from "../renderers/contract";
import type { RootComponent } from "../renderers/contract";
import StorageManager from "../storage/manager";
import ServiceProvider, {
    type Cleanup,
    type ServiceProviderContext,
} from "../support/service-provider";
import { registerGlobalStr } from "../support/str";
import { clearFacadeCache } from "../support/facades/facade";
import {
    getCurrentApplicationContainer,
    setLegacyApplicationContainerReader,
    setCurrentApplicationContainer,
} from "./current-application";

type ApplicationRunContext = ServiceProviderContext & {
    cleanupTasks: Cleanup[];
};

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
    protected rootElementId: string;
    protected RootComponent: RootComponent | null;
    protected renderer: Contract | null;
    protected options: ApplicationResolvedOptions;

    constructor(options: ApplicationResolvedOptions) {
        this.options = options;
        this.providers = this.getDefaultProviders();
        this.rootElementId = "root";
        this.RootComponent = null;
        this.renderer = null;
    }

    protected getDefaultProviders(): ServiceProvider[] {
        return [];
    }

    protected getConfigItems(): ConfigRepository {
        // Give each application instance its own mutable repository.
        return createConfig(this.options.basePath, this.options.config);
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
        const container = getCurrentApplicationContainer();
        if (!container) {
            throw new Error(
                "Application container is not available. Call run() first.",
            );
        }

        return container.make<T>(identifier);
    }

    withProviders(providers: ServiceProvider[]) {
        this.providers.push(...providers);
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

    protected registerCoreServices(container: ContainerContract): void {
        const configRepository = this.getConfigItems();
        const storageManager = StorageManager.fromConfig(configRepository);
        const cacheManager = CacheManager.fromConfig(configRepository);

        container.instance("config", configRepository);
        container.instance(ConfigRepository, configRepository);
        container.instance("storage", storageManager);
        container.instance(StorageManager, storageManager);
        container.instance("cache", cacheManager);
        container.instance(CacheManager, cacheManager);
    }

    protected rememberCleanup(
        cleanupTasks: Cleanup[],
        cleanup: void | Cleanup,
    ): void {
        if (typeof cleanup === "function") {
            cleanupTasks.push(cleanup);
        }
    }

    protected registerProviders(context: ApplicationRunContext): void {
        for (const provider of this.providers) {
            if (typeof provider.register === "function") {
                this.rememberCleanup(
                    context.cleanupTasks,
                    provider.register(context),
                );
            }
        }
    }

    protected bootProviders(context: ApplicationRunContext): void {
        for (const provider of this.providers) {
            if (typeof provider.boot === "function") {
                this.rememberCleanup(context.cleanupTasks, provider.boot(context));
            }
        }
    }

    protected renderRoot(context: ServiceProviderContext): Cleanup {
        if (this.renderer) {
            return this.renderWithConfiguredRenderer(context);
        }

        if (this.RootComponent) {
            throw new Error(
                "Renderer is required when root component is set. Install a renderer feature (react/solid/svelte/vue) and call withRenderer(...).",
            );
        }

        return () => {};
    }

    protected renderWithConfiguredRenderer(
        context: ServiceProviderContext,
    ): Cleanup {
        if (!this.renderer || !this.RootComponent) {
            throw new Error(
                "Root component is required when using a custom renderer.",
            );
        }

        return (
            this.renderer.render({
                ...context,
                RootComponent: this.RootComponent,
                rootElementId: this.rootElementId,
            }) ?? (() => {})
        );
    }

    protected createStopHandler(
        container: ContainerContract,
        rendererCleanup: Cleanup,
        cleanupTasks: Cleanup[],
    ): Cleanup {
        const stop: Cleanup = () => {
            rendererCleanup();

            for (const cleanup of cleanupTasks.reverse()) {
                cleanup();
            }

            clearFacadeCache();

            container.flush();

            if (getCurrentApplicationContainer() === container) {
                Application.container = null;
                setCurrentApplicationContainer(null);
            }
        };

        return stop;
    }

    run() {
        const container = this.createContainer();

        Application.container = container;
        setCurrentApplicationContainer(container);
        clearFacadeCache();
        this.registerCoreServices(container);

        const context = { container, cleanupTasks: [] };
        this.registerProviders(context);
        this.bootProviders(context);

        const rendererCleanup = this.renderRoot(context);
        const stop = this.createStopHandler(
            container,
            rendererCleanup,
            context.cleanupTasks,
        );

        window.addEventListener("beforeunload", stop, { once: true });

        return {
            container,
            stop,
        };
    }
}

setLegacyApplicationContainerReader(() => Application.container);
