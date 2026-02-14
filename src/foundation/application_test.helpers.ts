import {
    mergeContainerRuntimeOptions,
    packageJsonHasDependency,
    readContainerFactoryRegistry,
    readPackageJsonCandidates,
    type ContainerRuntimeOptions,
} from "@/container/runtime";
import type { ConfigItems } from "@/config/repository";
import { localAdapterTestingHelpers } from "@/filesystem/adapters/local_test.helpers";

type ApplicationConfigureOptions = {
    basePath?: string;
    container?: ContainerRuntimeOptions;
    config?: ConfigItems;
};

function mergeConfigureOptions(options: ApplicationConfigureOptions = {}) {
    return {
        basePath: options.basePath ?? "./",
        container: mergeContainerRuntimeOptions(options.container),
        config: options.config ?? {},
    };
}

export const applicationTestingHelpers = {
    ...localAdapterTestingHelpers,
    mergeConfigureOptions,
    readPackageJsonCandidates,
    packageJsonHasDependency,
    readContainerFactoryRegistry,
};
