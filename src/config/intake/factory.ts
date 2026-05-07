/**
 * Configuration factory for creating configuration repositories
 */
import type { ConfigItems } from "../contract";
import ConfigRepository from "../repository";
import type { ConfigLoader } from "./loader";
import { EsmConfigLoader } from "./esm-loader";

function createConfigRepository(
  basePath: string,
  staticItems: ConfigItems = {},
  loader?: ConfigLoader,
): ConfigRepository {
  const configLoader = loader ?? new EsmConfigLoader();
  const items = configLoader.load(basePath, staticItems);

  return new ConfigRepository(items);
}

export const ConfigFactory = {
  create: createConfigRepository,
};
