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

function cloneItems(items: ConfigItems): ConfigItems {
  if (typeof structuredClone === "function") {
    return structuredClone(items) as ConfigItems;
  }
  return JSON.parse(JSON.stringify(items)) as ConfigItems;
}

function loadEsmConfigModules(basePath: string): Record<string, unknown> {
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

  if (typeof glob !== "function") {
    return {};
  }

  const configPattern = basePath.endsWith("/")
    ? `${basePath}config/**/*.ts`
    : `${basePath}/config/**/*.ts`;
  const modules = glob(configPattern, { eager: true });

  return modules as Record<string, unknown>;
}

export class EsmConfigLoader implements ConfigLoader {
  async load(basePath: string, staticItems: ConfigItems = {}): Promise<ConfigItems> {
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