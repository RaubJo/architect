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

    const configuredPackages = normalizePackageJsonCandidates(testValue);
    if (configuredPackages) {
        return configuredPackages;
    }

    const glob = resolvePackageJsonGlob(testOptions);
    if (!glob) {
        return [];
    }

    const modules = glob("/package.json", { eager: true });
    return Object.values(modules)
        .map(readPackageJsonModule)
        .filter((value) => Boolean(value && typeof value === "object"));
}

function normalizePackageJsonCandidates(
    value: ContainerRuntimeTestOptions["packageJson"],
): PackageJsonLike[] | null {
    const packageJson = typeof value === "function" ? value() : value;
    if (!packageJson) {
        return null;
    }

    return Array.isArray(packageJson) ? packageJson : [packageJson];
}

function resolvePackageJsonGlob(
    testOptions?: ContainerRuntimeTestOptions,
): GlobLoader | null {
    const viteGlob = (
        import.meta as ImportMeta & {
            glob?: GlobLoader;
        }
    ).glob;
    if (typeof viteGlob === "function") {
        return viteGlob;
    }

    const testGlob = testOptions?.packageJsonGlob;
    return typeof testGlob === "function" ? testGlob : null;
}

function readPackageJsonModule(value: unknown): PackageJsonLike {
    if (
        value &&
        typeof value === "object" &&
        "default" in (value as Record<string, unknown>)
    ) {
        return (value as { default: unknown }).default as PackageJsonLike;
    }

    return value as PackageJsonLike;
}

export function packageJsonHasDependency(
    packageJson: PackageJsonLike,
    dependency: string,
): boolean {
    return [
        packageJson.dependencies,
        packageJson.devDependencies,
        packageJson.peerDependencies,
    ].some((dependencies) => Boolean(dependencies?.[dependency]));
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

    if (shouldUseBuiltinAdapter(options)) {
        return new BuiltinContainer();
    }

    return createInversifyOrFallbackContainer(options);
}

function shouldUseBuiltinAdapter(
    options: ResolvedContainerRuntimeOptions,
): boolean {
    return (
        options.adapter === "builtin" || !shouldUseInversifyAdapter(options)
    );
}

function createInversifyOrFallbackContainer(
    options: ResolvedContainerRuntimeOptions,
): ContainerContract {
    const factory = readContainerFactoryRegistry(options.test).inversify;
    if (typeof factory === "function") {
        return factory();
    }

    assertOptionalInversifyFallback(options.adapter);
    return new BuiltinContainer();
}

function assertOptionalInversifyFallback(adapter: ContainerAdapter): void {
    if (adapter === "inversify") {
        throw new Error(
            "Inversify adapter is not registered. Provide container.factory or set test.containerFactoryRegistry.inversify.",
        );
    }
}

function shouldUseInversifyAdapter(
    options: ResolvedContainerRuntimeOptions,
): boolean {
    return (
        options.adapter === "inversify" ||
        (options.adapter === "auto" && hasInversifyDependency(options.test))
    );
}
