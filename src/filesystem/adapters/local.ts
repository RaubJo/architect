import type { ConfigItems } from "@/config/repository";
import type { FileSystemAdapter } from "@/filesystem/filesystem";

type ConfigModule = { default?: unknown };
type GlobLoader = (
    pattern: string | string[],
    options?: { eager?: boolean },
) => Record<string, unknown>;

function fileNameWithoutExtension(path: string): string {
    const file = path.split("/").pop() ?? path;
    return file.replace(/\.[^/.]+$/, "");
}

function normalizeBasePath(basePath: string): string {
    const trimmed = basePath.trim();
    if (!trimmed || trimmed === "." || trimmed === "./" || trimmed === "/") {
        return "";
    }

    let normalized = trimmed.replace(/\\/g, "/");
    normalized = normalized.replace(/^\.\//, "");
    normalized = normalized.replace(/^\/+/, "");
    normalized = normalized.replace(/\/+$/, "");

    return normalized;
}

function isPathInConfigDirectories(path: string, basePath: string): boolean {
    const normalizedPath = path.replace(/\\/g, "/");
    const trimmedPath = normalizedPath.replace(/^\/+/, "").replace(/^\.\//, "");
    const normalizedBasePath = normalizeBasePath(basePath);

    const targets =
        normalizedBasePath ?
            [
                `${normalizedBasePath}/config/`,
                `${normalizedBasePath}/src/config/`,
            ]
        :   ["config/", "src/config/"];

    for (const target of targets) {
        if (
            trimmedPath.startsWith(target) ||
            normalizedPath.includes(`/${target}`) ||
            normalizedPath.endsWith(`/${target.slice(0, -1)}`)
        ) {
            return true;
        }
    }

    return false;
}

export default class LocalAdapter implements FileSystemAdapter {
    constructor() {}

    loadConfigItems(basePath: string): ConfigItems {
        const runtimeModules = (
            globalThis as {
                __iocConfigModules?: Record<string, unknown>;
            }
        ).__iocConfigModules;
        const viteGlob = (
            import.meta as ImportMeta & {
                glob?: GlobLoader;
            }
        ).glob;
        const runtimeGlob = (
            globalThis as {
                __iocConfigGlob?: GlobLoader;
            }
        ).__iocConfigGlob;
        const testGlob = (
            globalThis as {
                __iocConfigGlobForTests?: GlobLoader;
            }
        ).__iocConfigGlobForTests;
        const glob =
            typeof viteGlob === "function" ? viteGlob
            : typeof runtimeGlob === "function" ? runtimeGlob
            : typeof testGlob === "function" ? testGlob
            : null;
        if (!runtimeModules && !glob) {
            return {};
        }

        const modules =
            runtimeModules ??
            (glob(
                [
                    "/config/*.{js,mjs,cjs,ts,mts,cts}",
                    "/src/config/*.{js,mjs,cjs,ts,mts,cts}",
                ],
                { eager: true },
            ) as Record<string, unknown>);

        const discovered: ConfigItems = {};
        for (const [path, loaded] of Object.entries(modules)) {
            if (!isPathInConfigDirectories(path, basePath)) {
                continue;
            }

            const key = fileNameWithoutExtension(path);
            const module = loaded as ConfigModule;
            if (module && "default" in module && module.default !== undefined) {
                discovered[key] = module.default;
            }
        }

        return discovered;
    }
}
