# @raubjo/architect-core

`@raubjo/architect-core` is a Laravel-inspired application container for frontend applications.

It gives you a predictable boot process, a shared dependency container, service providers, framework-specific runtime helpers, and small configuration/storage/cache primitives that can be used consistently across React, Solid, Svelte, and Vue projects.

The package is intentionally small. It does not try to replace your framework state tools. Instead, it gives you a structured place to register services and application infrastructure, then resolve those services from components and startup code.

The current runtime is browser-oriented. `Application.run()` expects `window`, and renderer adapters expect a DOM mount node.

## Table of contents

- [Why this package exists](#why-this-package-exists)
- [What it includes](#what-it-includes)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Core mental model](#core-mental-model)
- [Application lifecycle](#application-lifecycle)
- [Container adapters](#container-adapters)
- [Working with service providers](#working-with-service-providers)
- [Framework integrations](#framework-integrations)
- [Configuration](#configuration)
- [Cache and storage](#cache-and-storage)
- [Facades](#facades)
- [Low-level utilities](#low-level-utilities)
- [Public exports](#public-exports)
- [Examples](#examples)
- [Development](#development)
- [Notes and constraints](#notes-and-constraints)

## Why this package exists

In small frontend applications, service wiring usually starts in components, top-level files, or ad hoc singleton modules. That works until:

- the same dependencies need to be created in multiple places
- startup and teardown logic become hard to reason about
- configuration is scattered across modules
- services need to be shared across framework components and non-UI code
- you want clearer separation between business logic and rendering

`@raubjo/architect-core` solves that by giving you:

- a central application object
- a container abstraction
- provider-based registration and boot hooks
- consistent setup and cleanup ordering
- runtime-specific `useService(...)` helpers
- optional facade-style access for config, cache, and storage

If you are familiar with Laravel service providers and container bindings, the design will feel familiar.

## What it includes

The current codebase provides:

- `Application` orchestration with `register -> services -> boot -> startup -> render`
- a built-in dependency injection container
- an Inversify adapter behind the same container contract
- service providers with cleanup support
- runtime helpers for React, Solid, Svelte, and Vue
- renderer adapters for React, Solid, Svelte, and Vue
- `ConfigRepository` with dot-notation lookups and typed getters
- `StorageManager` with memory, local storage, and IndexedDB-backed adapters
- `CacheManager` built on the same adapter contract as storage
- facades for config, cache, and storage
- small utility exports such as `env`, `Str`, and filesystem/config helpers

## Installation

```sh
bun add @raubjo/architect-core reflect-metadata
```

Framework integrations are imported from subpaths:

```ts
import { ContextProvider, useService } from "@raubjo/architect-core/react";
```

Optional peer dependencies depend on the runtime you use:

- `react` and `react-dom` for React
- `solid-js` for Solid
- `svelte` for Svelte
- `vue` for Vue
- `inversify` if you want the Inversify container adapter

If you use decorator-based constructor injection with the built-in container, or Inversify, load `reflect-metadata` before resolving those classes:

```ts
import "reflect-metadata";
```

## Quick start

This is the smallest useful application shape:

```ts
import "reflect-metadata";
import { Application, ServiceProvider, type ServiceProviderContext } from "@raubjo/architect-core";
import { ContextProvider, useService } from "@raubjo/architect-core/react";
import ReactDOM from "react-dom/client";
import { createElement } from "react";

class CounterService {
  protected count = 0;

  increment(): number {
    this.count += 1;
    return this.count;
  }

  current(): number {
    return this.count;
  }
}

class CounterProvider extends ServiceProvider {
  register({ container }: ServiceProviderContext): void {
    container.singleton(CounterService, CounterService);
  }
}

function App() {
  const counter = useService(CounterService);

  return (
    <button
      onClick={() => {
        counter.increment();
      }}
    >
      Count: {counter.current()}
    </button>
  );
}

const application = Application.configure({
  container: { adapter: "builtin" },
  config: {
    app: { name: "Architect Example" },
  },
})
  .withProviders([new CounterProvider()]);

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(createElement(ContextProvider, { application }, createElement(App)));
```

`Application.run()` returns:

```ts
{
  container,
  stop,
}
```

The returned `container` is the active runtime container. `stop()` runs cleanup callbacks in reverse order, clears facade caches, and flushes the container.

## Core mental model

The package is built around a few simple ideas:

### 1. The application owns startup

`Application.configure(...).run()` is the entry point. It creates the container, registers built-in services, runs provider hooks, runs startup callbacks, and mounts a renderer when one is configured.

### 2. Providers own wiring

Register application services once in providers instead of rebuilding them inside components.

### 3. Components resolve services, not construction rules

Framework code should usually call `useService(...)` or consume already-registered abstractions. Construction details stay in providers and service registrars.

### 4. Reactivity is your service’s responsibility

`useService(...)` resolves an object from the container. It does not automatically subscribe a component to changes inside that object.

If a service exposes mutable state, you still need a framework-appropriate reactive mechanism such as:

- component state
- signals
- framework stores
- subscriptions
- Zustand or another state library

The examples in this repository show both simple imperative services and services that expose reactive state mechanisms.

## Application lifecycle

`Application.run()` executes in this order:

1. provider `register()`
2. `.withServices(...)` callbacks
3. provider `boot()`
4. `.withStartup(...)` callbacks

Cleanup runs in reverse order when `stop()` is called:

1. startup cleanup
2. provider `boot()` cleanup
3. service registrar cleanup
4. provider `register()` cleanup

The application also registers a `beforeunload` listener and calls `stop()` once when the page unloads.

### Built-in services registered by `Application`

Every application instance automatically registers:

- `"config"` and `ConfigRepository`
- `"storage"` and `StorageManager`
- `"cache"` and `CacheManager`

That means you can resolve them by string identifier or by class identifier.

### Application builder methods

The main fluent API is:

- `Application.configure(basePath?: string)`
- `Application.configure(options?: { basePath?: string; container?: ...; config?: ... })`
- `.withProviders(providers)`
- `.withServices(registerServices)`
- `.withStartup(startupHandler)`
- `.run()`

Static resolution is also available:

```ts
const config = Application.make("config");
```

That only works after `run()`. Calling `Application.make(...)` before the app starts throws.

## Container adapters

The package exposes a common `ContainerContract` and currently ships with two concrete adapters:

- built-in container
- Inversify container

### Selecting an adapter

Container runtime options look like this:

```ts
{
  adapter?: "auto" | "builtin" | "inversify";
  factory?: (() => ContainerContract) | null;
}
```

Resolution rules are:

- if `factory` is provided, it wins
- if `adapter` is `"builtin"`, the built-in container is used
- if `adapter` is `"inversify"`, the runtime expects an Inversify factory to be registered
- if `adapter` is `"auto"`, the runtime prefers Inversify when it detects an `inversify` dependency and a factory is available; otherwise it falls back to the built-in container

### Built-in container

The built-in container supports:

- `bind(...).to(...)`
- `bind(...).toDynamicValue(...)`
- `bind(...).toConstantValue(...)`
- `singleton(identifier, concrete)`
- `transient(identifier, concrete)`
- `instance(identifier, value)`
- `make(...)` and `get(...)`
- `bound(...)` and `has(...)`
- `unbind(...)`, `unbindAll()`, and `flush()`

Constructor injection is supported through `design:paramtypes` metadata. Parameter-level token overrides are supported through the exported `injectDependency(...)` decorator.

Example:

```ts
import "reflect-metadata";
import {
  Application,
  injectDependency,
} from "@raubjo/architect-core";

class Logger {
  log(message: string) {
    console.log(message);
  }
}

class Greeter {
  constructor(
    public readonly logger: Logger,
    @injectDependency("app.name") public readonly appName: string,
  ) {}

  greet() {
    this.logger.log(`Hello from ${this.appName}`);
  }
}

const { container } = Application.configure({
  container: { adapter: "builtin" },
})
  .withServices(({ container }) => {
    container.singleton(Logger, Logger);
    container.instance("app.name", "Architect");
    container.transient(Greeter, Greeter);
  })
  .run();

container.make(Greeter).greet();
```

Important built-in container behaviors:

- string, symbol, and class identifiers are supported
- unbound class identifiers can still be resolved directly
- circular constructor dependencies throw
- missing constructor metadata for a parameter throws
- singletons are cached after first resolution
- transient factories/classes resolve anew each time

### Inversify adapter

If you want to use Inversify, install `inversify` and register an adapter factory on `globalThis.__iocContainerFactoryRegistry`:

```ts
import "reflect-metadata";
import { Application } from "@raubjo/architect-core";
import InversifyContainer from "@raubjo/architect-core/container/adapters/inversify";

globalThis.__iocContainerFactoryRegistry = {
  inversify: () => new InversifyContainer(),
};

Application.configure({
  container: { adapter: "inversify" },
}).run();
```

If you explicitly request `adapter: "inversify"` and no factory is registered, the runtime throws a configuration error.

## Working with service providers

Providers are the main extension point for application wiring.

The base class is:

```ts
class ServiceProvider {
  register(context): void | Cleanup {}
  boot(context): void | Cleanup {}
}
```

Use `register()` for bindings and `boot()` for work that should happen after all providers and manual service registrations are complete.

Both methods may optionally return a cleanup callback.

`DeferrableServiceProvider` is also exported, but in the current implementation it is only a base class with a `provides()` method. The application runtime does not yet perform automatic deferred loading based on that contract.

Example:

```ts
import {
  ServiceProvider,
  type Cleanup,
  type ServiceProviderContext,
} from "@raubjo/architect-core";

class HeartbeatService {
  protected intervalId: number | null = null;
  protected ticksValue = 0;

  ticks() {
    return this.ticksValue;
  }

  start(): Cleanup {
    if (this.intervalId !== null) {
      return () => this.stop();
    }

    this.intervalId = window.setInterval(() => {
      this.ticksValue += 1;
    }, 1000);

    return () => this.stop();
  }

  stop() {
    if (this.intervalId === null) {
      return;
    }

    window.clearInterval(this.intervalId);
    this.intervalId = null;
  }
}

class HeartbeatProvider extends ServiceProvider {
  register({ container }: ServiceProviderContext): void {
    container.singleton(HeartbeatService, HeartbeatService);
  }

  boot({ container }: ServiceProviderContext): Cleanup {
    return container.get(HeartbeatService).start();
  }
}
```

You can mix providers with `.withServices(...)` and `.withStartup(...)` when a full provider class would be excessive.

## Framework integrations

Each supported framework has:

- a runtime entrypoint with service resolution helpers
- a context/provider helper so you choose the context boundary
- an optional renderer adapter you can use directly if you want a turnkey mount

### React

Import from `@raubjo/architect-core/react`:

- `ContextProvider`
- `ApplicationProvider`
- `Renderer`
- `useService`

`ContextProvider` runs the application and provides the container through React context, so you can decide where the application boundary lives in your component tree.

```ts
import { useService } from "@raubjo/architect-core/react";

function App() {
  const service = useService(MyService);
  return <div>{service.value()}</div>;
}
```

### Solid

Import from `@raubjo/architect-core/solid`:

- `ContextProvider`
- `ApplicationProvider`
- `Renderer`
- `useService`

`ContextProvider` runs the application and provides the container through Solid context.

```ts
import { useService } from "@raubjo/architect-core/solid";

function App() {
  const service = useService(MyService);
  return <div>{service.value()}</div>;
}
```

### Svelte

Import from `@raubjo/architect-core/svelte`:

- `Renderer`
- `containerKey`
- `provideContainer` (alias: `ContextProvider`)
- `useService`

The Svelte renderer passes `container` as a prop to the root component. Inside the component, call `provideContainer(container)` (or `ContextProvider(container)`) before using `useService(...)`.

```svelte
<script lang="ts">
  import { provideContainer, useService } from "@raubjo/architect-core/svelte";
  import CounterService from "./counter/service";

  export let container: unknown;

  provideContainer(container as never);
  const counter = useService(CounterService);
</script>
```

### Vue

Import from `@raubjo/architect-core/vue`:

- `ContextProvider`
- `Renderer`
- `useService`

`ContextProvider` runs the application, provides the container via Vue injection, and renders its slot content.

```vue
<script setup lang="ts">
import { useService } from "@raubjo/architect-core/vue";

const service = useService(MyService);
</script>
```

### Renderer behavior

All renderers:

- look up a DOM mount node by `rootElementId`
- throw if the mount node does not exist
- return a cleanup function that unmounts the rendered tree

Renderers are not coupled to `Application`. If you want turnkey mounting, call `app.run()` yourself, then pass the returned `container` into a renderer (or into a framework `ContextProvider`).

## Configuration

`Application` does not implicitly load config files during startup. The configuration source for an app instance is the object you pass into `Application.configure({ config })`.

Example:

```ts
const running = Application.configure({
  config: {
    app: {
      name: "Architect",
      timezone: "UTC",
    },
    storage: {
      driver: "memory",
    },
    cache: {
      default: "memory",
    },
  },
}).run();
```

That data is cloned per application instance before it is wrapped in `ConfigRepository`.

### `ConfigRepository`

`ConfigRepository` supports:

- dot-notation reads
- `has(...)`
- `get(...)`
- `getMany(...)`
- typed accessors: `string`, `integer`, `float`, `boolean`, `array`
- writes via `set(...)`
- array mutation helpers via `prepend(...)` and `push(...)`
- offset-style helpers like `offsetGet(...)` and `offsetUnset(...)`

Example:

```ts
import { ConfigRepository } from "@raubjo/architect-core";

const config = new ConfigRepository({
  app: {
    name: "Architect",
    retries: 3,
    tags: ["frontend"],
  },
});

config.string("app.name"); // "Architect"
config.integer("app.retries"); // 3
config.push("app.tags", "ioc");
```

### `env(...)`

The exported `env(...)` helper reads from:

1. `import.meta.env`
2. `process.env`

It normalizes common string forms:

- `"true"` and `"(true)"` -> `true`
- `"false"` and `"(false)"` -> `false`
- `"null"` and `"(null)"` -> `null`
- `"empty"` and `"(empty)"` -> `""`

It is also registered globally as `env` when the module is loaded.

## Cache and storage

The package ships with two manager abstractions:

- `StorageManager`
- `CacheManager`

Both use the same async adapter contract:

```ts
interface Adapter {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}
```

### Storage

`StorageManager` reads its active driver from `storage.driver`.

Supported built-in drivers:

- `memory`
- `local`
- `indexed`

Default behavior:

- `memory` uses an in-memory `Map`
- `local` uses `window.localStorage` when available, otherwise falls back to memory
- `indexed` uses `indexedDB` when available, otherwise falls back to memory

Example:

```ts
const app = Application.configure({
  config: {
    storage: {
      driver: "local",
    },
  },
}).run();

const storage = app.container.get("storage");
await storage.set("draft", { title: "Post" });
```

You can also switch drivers manually:

```ts
storage.use("memory");
```

### Cache

`CacheManager` is intentionally very similar, but it reads from a cache-specific configuration shape:

```ts
{
  cache: {
    default: "memory",
    stores: {
      memory: { driver: "memory" },
      persistent: { driver: "indexed" },
    },
  },
}
```

`cache.default` selects the active store, and `cache.stores` maps store names to drivers.

If a configured store points to an unknown driver, the implementation falls back to the memory driver.

Example:

```ts
const cache = app.container.get("cache");

await cache.set("session", { ok: true });
await cache.get("session");

cache.use("persistent");
```

### IndexedDB fallback behavior

The IndexedDB adapter is resilient by design:

- if IndexedDB is unavailable, it falls back to another adapter
- if database open or request operations fail, it falls back to the configured fallback adapter
- the default fallback is an in-memory adapter

That makes it safe to use in mixed browser or test environments without adding a separate compatibility layer.

## Facades

Facade classes provide a static access pattern similar to Laravel:

- `Config`
- `Cache`
- `Store`

Example:

```ts
import { Config, Cache, Store } from "@raubjo/architect-core";

const name = Config.get("app.name");
await Cache.set("token", "abc");
await Store.set("draft", { id: 1 });
```

Facade resolution works through `Application.make(...)`, and resolved instances are cached per facade accessor until the application is stopped or facade caches are cleared.

That means facades only work correctly after the application has started.

## Low-level utilities

The codebase also exports a few lower-level building blocks.

### `FileSystem` and local config loading

`FileSystem` is a small wrapper around a `FileSystemAdapter`. The bundled `LocalAdapter` can discover config modules from `config/*` and `src/config/*` using `import.meta.glob(...)`.

This is not used automatically by `Application` today, but it is available if you want explicit config-module loading in your own bootstrap code.

### `loadConfig(...)`

`@raubjo/architect-core/config/adapters/esm` exports `loadConfig(modules)`, which turns an ESM module map into a config object keyed by filename.

### `Str`

`Str` provides a few common string helpers:

- `lower`
- `upper`
- `length`
- `contains`
- `startsWith`
- `endsWith`
- `replace`
- `snake`
- `kebab`
- `studly`
- `camel`
- `slug`

It is also registered globally as `Str` when the package is loaded.

## Public exports

The main export surface is defined in `package.json`.

Important root exports include:

- `Application`
- `BuiltinContainer`
- `injectDependency`
- `ServiceProvider`
- `DeferrableServiceProvider`
- `ConfigRepository`
- `env`
- `Str`
- `Config`, `Cache`, `Store`
- `CacheManager`
- `StorageManager`
- `MemoryStorageAdapter`
- `LocalStorageAdapter`
- `IndexedDbAdapter`
- `FileSystem`
- `LocalAdapter`

Important subpath exports include:

- `@raubjo/architect-core/react`
- `@raubjo/architect-core/solid`
- `@raubjo/architect-core/svelte`
- `@raubjo/architect-core/vue`
- `@raubjo/architect-core/application`
- `@raubjo/architect-core/container/contract`
- `@raubjo/architect-core/container/adapters/inversify`
- `@raubjo/architect-core/container/adapters/builtin`
- `@raubjo/architect-core/config/adapters/esm`
- `@raubjo/architect-core/config/env`
- `@raubjo/architect-core/config/repository`
- `@raubjo/architect-core/cache/manager`
- `@raubjo/architect-core/storage/manager`
- `@raubjo/architect-core/filesystem/filesystem`
- renderer and facade subpaths

## Examples

The repository contains runnable examples under `examples/`:

- `examples/react`
- `examples/solid`
- `examples/svelte`
- `examples/vue`

Each example shows:

- application bootstrap
- provider registration
- service resolution from components
- a user-driven counter service
- a heartbeat/background service with startup and cleanup behavior

To run one:

```sh
cd examples/react
bun install
bun run dev
```

The example applications are intentionally minimal and are the best place to inspect framework-specific bootstrapping details.

## Development

This repository is written in TypeScript and tested with Bun.

Useful scripts:

```sh
bun test
bun test --coverage
```

Formatting:

```sh
bun run fix
```

The project uses:

- ESM modules
- `strict` TypeScript mode
- `moduleResolution: "Bundler"`
- JSX enabled for React-oriented source files

Tests cover:

- application lifecycle ordering and cleanup
- built-in container behavior
- Inversify adapter behavior
- runtime helpers for each supported framework
- configuration helpers
- storage adapters and fallbacks
- cache manager behavior
- facade resolution

## Notes and constraints

The current implementation has a few important constraints worth knowing up front:

- `Application.configure(basePath)` is still supported, but startup configuration is driven by `configure({ config })`, not automatic filesystem discovery.
- `Application.clearConfigCache()` exists for compatibility but is currently a no-op.
- `useService(...)` resolves a dependency from the active container; it does not subscribe components to service internals automatically.
- `DeferrableServiceProvider` does not currently enable deferred provider loading by itself.
- Svelte root components are expected to receive `container` as a prop and call `provideContainer(...)` before using `useService(...)`.
- Explicit `adapter: "inversify"` requires a registered factory on `globalThis.__iocContainerFactoryRegistry`.
- If you set a root component without a renderer, or a renderer without a root component, the application throws.
- `Application.run()` is designed for browser/client execution and assumes `window` is available.
- All renderer adapters require the target mount node to exist in the DOM.

## License

MIT
