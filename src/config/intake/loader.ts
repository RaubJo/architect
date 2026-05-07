/**
 * Configuration loader contract for loading configuration from various sources
 */
import type { ConfigItems } from "../contract";

export interface ConfigLoader {
  /**
   * Load configuration items
   * @param basePath The base path to load configuration from
   * @param staticItems Static configuration items to merge with loaded items
   * @returns Configuration items
   */
  load(basePath: string, staticItems?: ConfigItems): Promise<ConfigItems>;
}