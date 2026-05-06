import BuiltinContainer from "./adapters/builtin";
import type { ContainerContract } from "./contract";

export type ContainerAdapter = "auto" | "builtin" | "inversify";

type PackageJsonLike = {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
};

type ContainerFactoryRegistry = {
    inversify?: () => ContainerContract;
};

type GlobLoader = (
    pattern: string | string[],
    options?: { eager?: boolean },
) => Record<string, unknown>;

export type ContainerRuntimeTestOptions = {
    packageJson?:
        | PackageJsonLike
        | PackageJsonLike[]
        | (() => PackageJsonLike | PackageJsonLike[]);
    packageJsonGlob?: GlobLoader;
    containerFactoryRegistry?: ContainerFactoryRegistry;
};

export type ContainerRuntimeOptions = {
    adapter?: ContainerAdapter;
    factory?: (() => ContainerContract) | null;
    test?: ContainerRuntimeTestOptions;
};

export type ResolvedContainerRuntimeOptions = {
    adapter: ContainerAdapter;
    factory: (() => ContainerContract) | null;
    test: ContainerRuntimeTestOptions;
};

export function mergeContainerRuntimeOptions(
    options: ContainerRuntimeOptions = {},
): ResolvedContainerRuntimeOptions {
    return {
        adapter: options.adapter ?? "auto",
        factory: options.factory ?? null,
        test: options.test ?? {},
    };
}

export function readPackageJsonCandidates(
    testOptions?: ContainerRuntimeTestOptions,
): PackageJsonLike[] {
    const testValue = testOptions?.packageJson;

    if (typeof testValue === "function") {
        const value = testValue();
        return Array.isArray(value) ? value : [value];
    }
    if (testValue) {
        return Array.isArray(testValue) ? testValue : [testValue];
    }

    const viteGlob = (
        import.meta as ImportMeta & {
            glob?: GlobLoader;
        }
    ).glob;
    const testGlob = testOptions?.packageJsonGlob;
    const glob =
        typeof viteGlob === "function" ? viteGlob
        : typeof testGlob === "function" ? testGlob
        : null;
    if (!glob) {
        return [];
    }

    const modules = glob("/package.json", { eager: true });
    return Object.values(modules)
        .map((value) => {
            if (
                value &&
                typeof value === "object" &&
                "default" in (value as Record<string, unknown>)
            ) {
                return (value as { default: unknown })
                    .default as PackageJsonLike;
            }
            return value as PackageJsonLike;
        })
        .filter((value) => Boolean(value && typeof value === "object"));
}

export function packageJsonHasDependency(
    packageJson: PackageJsonLike,
    dependency: string,
): boolean {
    return Boolean(
        packageJson.dependencies?.[dependency] ||
            packageJson.devDependencies?.[dependency] ||
            packageJson.peerDependencies?.[dependency],
    );
}

export function readContainerFactoryRegistry(
    testOptions?: ContainerRuntimeTestOptions,
): ContainerFactoryRegistry {
    return testOptions?.containerFactoryRegistry ?? {};
}

export function hasInversifyDependency(
    testOptions?: ContainerRuntimeTestOptions,
): boolean {
    const packageJsonCandidates = readPackageJsonCandidates(testOptions);
    return packageJsonCandidates.some((packageJson) =>
        packageJsonHasDependency(packageJson, "inversify"),
    );
}

export function createRuntimeContainer(
    options: ResolvedContainerRuntimeOptions,
): ContainerContract {
    if (typeof options.factory === "function") {
        return options.factory();
    }

    if (options.adapter === "builtin") {
        return new BuiltinContainer();
    }

    const inversifyFactory =
        readContainerFactoryRegistry(options.test).inversify;
    const shouldUseInversify =
        options.adapter === "inversify" ||
        (options.adapter === "auto" &&
            hasInversifyDependency(options.test));

    if (shouldUseInversify) {
        if (typeof inversifyFactory === "function") {
            return inversifyFactory();
        }

        if (options.adapter === "inversify") {
            throw new Error(
                "Inversify adapter is not registered. Provide container.factory or set test.containerFactoryRegistry.inversify.",
            );
        }
    }

    return new BuiltinContainer();
}
