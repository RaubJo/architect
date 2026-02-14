import BuiltinContainer from "./adapters/builtin";
import type { ContainerContract } from "./contract";

export type ContainerAdapter = "auto" | "builtin" | "inversify";

export type ContainerRuntimeOptions = {
    adapter?: ContainerAdapter;
    factory?: (() => ContainerContract) | null;
};

export type ResolvedContainerRuntimeOptions = {
    adapter: ContainerAdapter;
    factory: (() => ContainerContract) | null;
};

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

export function mergeContainerRuntimeOptions(
    options: ContainerRuntimeOptions = {},
): ResolvedContainerRuntimeOptions {
    return {
        adapter: options.adapter ?? "auto",
        factory: options.factory ?? null,
    };
}

export function readPackageJsonCandidates(): PackageJsonLike[] {
    const testValue = (
        globalThis as {
            __iocPackageJsonForTests?:
                | PackageJsonLike
                | PackageJsonLike[]
                | (() => PackageJsonLike | PackageJsonLike[]);
        }
    ).__iocPackageJsonForTests;

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
    const testGlob = (
        globalThis as {
            __iocPackageJsonGlobForTests?: GlobLoader;
        }
    ).__iocPackageJsonGlobForTests;
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

export function readContainerFactoryRegistry(): ContainerFactoryRegistry {
    return (
        (
            globalThis as {
                __iocContainerFactoryRegistry?: ContainerFactoryRegistry;
            }
        ).__iocContainerFactoryRegistry ?? {}
    );
}

export function hasInversifyDependency(): boolean {
    const packageJsonCandidates = readPackageJsonCandidates();
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

    const inversifyFactory = readContainerFactoryRegistry().inversify;
    const shouldUseInversify =
        options.adapter === "inversify" ||
        (options.adapter === "auto" && hasInversifyDependency());

    if (shouldUseInversify) {
        if (typeof inversifyFactory === "function") {
            return inversifyFactory();
        }

        if (options.adapter === "inversify") {
            throw new Error(
                "Inversify adapter is not registered. Provide container.factory or register __iocContainerFactoryRegistry.inversify.",
            );
        }
    }

    return new BuiltinContainer();
}
