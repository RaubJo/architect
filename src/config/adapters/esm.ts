import type { ConfigItems } from "@/config/repository";

type ConfigModule = { default?: unknown };

function fileNameWithoutExtension(path: string): string {
    const file = path.split("/").pop() ?? path;
    return file.replace(/\.[^/.]+$/, "");
}

export function loadConfig(modules: Record<string, unknown>): ConfigItems {
    const discovered: ConfigItems = {};

    for (const [path, loaded] of Object.entries(modules)) {
        const key = fileNameWithoutExtension(path);
        if (key === "index") {
            continue;
        }

        const module = loaded as ConfigModule;
        if (module && "default" in module && module.default !== undefined) {
            discovered[key] = module.default;
        }
    }

    return discovered;
}
