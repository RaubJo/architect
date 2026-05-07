/**
 * Configuration factory for creating configuration repositories
 */
import type { ConfigItems } from "../contract";
import ConfigRepository from "../repository";
import type { ConfigLoader } from "./loader";
import { EsmConfigLoader } from "./esm-loader";

export class ConfigFactory {
  /**
   * Create a configuration repository
   * @param basePath The base path to load configuration from
   * @param staticItems Static configuration items
   * @param loader The loader to use (defaults to ESM loader)
   * @returns Configuration repository
   */
  static create(
    basePath: string, 
    staticItems: ConfigItems = {}, 
    loader?: ConfigLoader
  ): ConfigRepository {
    // Use default loader if none provided
    const configLoader = loader || new EsmConfigLoader();
    
    // In a real implementation, this would be async
    // For now, we'll simulate the async loading
    const items = configLoader.load(basePath, staticItems);
    
    // In a real implementation, this should be handled asynchronously
    // For now, we'll proceed with sync for compatibility
    return new ConfigRepository(items);
  }
}
