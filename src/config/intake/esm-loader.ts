/**
 * ESM module configuration loader
 */
import type { ConfigLoader } from "./loader";
import type { ConfigItems } from "../contract";
import type { GlobLoader } from "../../container/runtime";

type ConfigModule = { default?: unknown };

function fileNameWithoutExtension(path: string): string {
  const file = path.split("/").pop() ?? path;
  return file.replace(/\.[^/.]+$/, "");
}

function loadConfigFromModules(modules: Record<string, unknown>): ConfigItems {
  const discovered: ConfigItems = {};

  for (const [path, loaded] of Object.entries(modules)) {
    const key = fileNameWithoutExtension(path);
    const value = readConfigModuleDefault(loaded);
    if (key !== "index" && value !== undefined) {
      discovered[key] = value;
    }
  }

  return discovered;
}

function readConfigModuleDefault(loaded: unknown): unknown {
  const module = loaded as ConfigModule;
  return module && "default" in module ? module.default : undefined;
}

function cloneItems(items: ConfigItems): ConfigItems {
  if (typeof structuredClone === "function") {
    return structuredClone(items) as ConfigItems;
  }
  return JSON.parse(JSON.stringify(items)) as ConfigItems;
}

function loadEsmConfigModules(basePath: string): Record<string, unknown> {
  const glob = resolveConfigGlob();
  if (!glob) {
    return {};
  }

  const modules = glob(configPatternForBasePath(basePath), { eager: true });
  return modules as Record<string, unknown>;
}

function resolveConfigGlob(): GlobLoader | null {
  const testGlob = (
    globalThis as {
      __iocConfigGlobForTests?: GlobLoader;
    }
  ).__iocConfigGlobForTests;

  const viteGlob = (
    import.meta as ImportMeta & {
      glob?: GlobLoader;
    }
  ).glob;

  const glob =
    typeof testGlob === "function" ? testGlob
    : typeof viteGlob === "function" ? viteGlob
    : null;

  return glob;
}

function configPatternForBasePath(basePath: string): string {
  return basePath.endsWith("/")
    ? `${basePath}config/**/*.ts`
    : `${basePath}/config/**/*.ts`;
}

export class EsmConfigLoader implements ConfigLoader {
  load(basePath: string, staticItems: ConfigItems = {}): ConfigItems {
    // Only load ESM modules when no static items are provided.
    // When explicit config is passed, ESM loading is skipped.
    const shouldLoadEsm = Object.keys(staticItems).length === 0;

    const esmItems = shouldLoadEsm ?
      loadConfigFromModules(loadEsmConfigModules(basePath))
    :   {};

    const merged: ConfigItems = { ...esmItems, ...cloneItems(staticItems) };

    return merged;
  }
}
