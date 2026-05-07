import ConfigRepository, { type ConfigItems } from "./repository";
import { ConfigFactory } from "./intake/factory";

export function createConfig(
    basePath: string,
    staticItems: ConfigItems = {},
): ConfigRepository {
    return ConfigFactory.create(basePath, staticItems);
}