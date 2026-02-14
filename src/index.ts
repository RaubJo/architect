/// <reference path="./config/env.global.d.ts" />

export { Application } from "./foundation/application";
export type { ApplicationConfigureOptions } from "./foundation/application";
export { default as BuiltinContainer } from "./container/adapters/builtin";
export { inject as injectDependency } from "./container/adapters/builtin";
export type {
  ContainerContract,
  ContainerIdentifier,
  ContainerFactory,
  ContainerClass,
  ContainerConcrete,
} from "./container/contract";
export { default as ServiceProvider } from "./support/service-provider";
export { DeferrableServiceProvider } from "./support/service-provider";
export type { Cleanup, ServiceProviderContext } from "./support/service-provider";

export type {
  default as Contract,
  RendererContext,
  RootComponent,
} from "./renderers/contract";
export { default as ConfigRepository } from "./config/repository";
export { env } from "./config/env";
export { default as Str } from "./support/str";
export { default as ConfigFacade } from "./support/facades/config";
export { default as Config } from "./support/facades/config";
export { default as CacheManager } from "./cache/manager";
export type { CacheStore } from "./cache/cache";
export { default as CacheFacade } from "./support/facades/cache";
export { default as Cache } from "./support/facades/cache";
export { default as StorageManager } from "./storage/manager";
export { default as StorageFacade } from "./support/facades/storage";
export { default as Storage } from "./support/facades/storage";
export type { Adapter as StorageAdapter } from "./storage/adapters/contract";
export { default as MemoryStorageAdapter } from "./storage/adapters/memory";
export { default as LocalStorageAdapter } from "./storage/adapters/local-storage";
export { default as IndexedDbAdapter } from "./storage/adapters/indexed-db";
export { FileSystem } from "./filesystem/filesystem";
export { default as LocalAdapter } from "./filesystem/adapters/local";
export { default as SvelteRenderer } from "./renderers/adapters/svelte";
export { default as VueRenderer } from "./renderers/adapters/vue";
