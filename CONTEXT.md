# Architect Core

A dependency injection library for frontend applications. It provides a lifecycle that guarantees the container and its registered services are fully resolved before the UI framework renders, along with service providers, configuration, storage/cache management, and adapters for React, Solid, Svelte, and Vue.

## Language

**Application**:
The central orchestrator — a fluent builder consumers configure with `.withProviders([])`, `.withConfig()`, `.withRoot()`, and `.withRenderer()` before calling `.run()`.
_Avoid_: app instance, container app

**Lifecycle**:
The fixed sequence the Application follows: register all providers → boot all providers → mount renderer. Shutdown runs in exact reverse. No phase may be skipped or reordered.

**ServiceProvider**:
The unit of wiring — a class that encapsulates registration and boot for one feature area. Consumers subclass it and pass instances to `.withProviders([])`. This is the primary wiring API.
_Avoid_: plugin, module, service class

**DeferrableServiceProvider**:
A ServiceProvider that declares which bindings it provides via `provides()`. The Application skips booting it until one of those bindings is actually resolved from the container — an optimization for services not always needed.

**Register/boot contract**:
The rule that `register()` must only bind into the container — never resolve. `boot()` may safely resolve any binding because all providers' `register()` calls have completed first. Violating this in `register()` risks resolving `undefined` for bindings added by later providers.

**Provider ownership**:
The principle that each ServiceProvider is the sole owner of registration, booting, and cleanup for its feature area. No other code binds or unbinds what a provider manages.

**ContainerContract**:
The interface all container implementations must satisfy. Exposes `bind()`, `singleton()`, `transient()`, `instance()`, `make()`, `bound()`, and `flush()`.
_Avoid_: IoC container, DI container (use "container")

**BuiltinContainer**:
The only shipped container implementation. Resolves constructor dependencies via TypeScript `design:paramtypes` reflection metadata and optional `@inject` decorators. Requires `emitDecoratorMetadata: true` in tsconfig.

**ConfigRepository**:
A typed key-value store with dot-notation path access (e.g. `config.get<string>("app.name")`). Backed by a plain object; no reactivity.
_Avoid_: config store, config object, Repository (ambiguous)

**StorageManager**:
An abstraction over persistent storage backends — localStorage, IndexedDB, and extensible to native file systems (Tauri, React Native) via `extend()` (not yet implemented). The active driver is swapped at runtime with `.use()`.

**CacheManager**:
An abstraction for ephemeral, non-persistent caching. Intended to sit on top of a storage backend and add TTL and eviction. **Not designed for long-term storage.** TTL and eviction are not yet implemented; the current adapter shape matches StorageManager.
_Avoid_: cache store (use "CacheManager" or "cache driver")

**Driver**:
A named backend implementation registered with StorageManager or CacheManager. Built-in drivers: `memory`, `local`, `indexed`. Custom drivers will be registered from a ServiceProvider's `boot()` hook via `manager.extend(name, factory)` — not yet implemented.

**Fallback chain**:
The ordered list of drivers a Manager tries when the preferred driver is unavailable. Enables graceful degradation (e.g. IndexedDB → localStorage → memory) without consumer awareness.

**Renderer**:
A framework-specific adapter that mounts and unmounts the root component. Adapters are provided for React, Solid, Svelte, and Vue. Passed to `.withRenderer()`.

**Facade**:
A static proxy that forwards calls to a service resolved from the container. Usable from `boot()` hooks onward — not in `register()` (register/boot contract). Calling a facade before `.run()` throws. Built-in facades: `Config`, `Cache`, `Storage`.
_Avoid_: static accessor, global service

**Macro**:
A named function added to a Facade at runtime via `facade.macro(name, fn)`. Takes precedence over instance methods of the same name. Survives facade instance cache resets; cleared only by `flushMacros()` or application shutdown.

## Relationships

- An **Application** runs one or more **ServiceProviders** in registration order
- A **DeferrableServiceProvider** extends **ServiceProvider** with lazy boot behaviour
- Each **ServiceProvider** binds into and resolves from one **ContainerContract**
- A **BuiltinContainer** implements **ContainerContract**
- A **Facade** resolves its backing service from the current **Application**'s **ContainerContract**
- A **Macro** extends a **Facade** without modifying the underlying service
- A **StorageManager** and **CacheManager** each manage a set of named **Drivers** with a **Fallback chain**
- An **Application** holds exactly one **Renderer**, which mounts one root component

## Example dialogue

> **Dev:** "I need to add a real-time data service that polls an external API every 30 seconds."
>
> **Domain expert:** "Write a **ServiceProvider**. In `register()`, bind your polling service class into the container. In `boot()`, start the interval — `boot()` is where you call things that depend on other bindings being present. Return a cleanup function from `boot()` that clears the interval; the **Application** will call it on shutdown."
>
> **Dev:** "Can I access the `Config` **Facade** to read the poll interval from config?"
>
> **Domain expert:** "Yes — **Facades** are safe in `boot()`. Don't use them in `register()`, that's a **register/boot contract** violation."
>
> **Dev:** "And if this service is only needed on certain routes, can I avoid booting it eagerly?"
>
> **Domain expert:** "Make it a **DeferrableServiceProvider** and declare the binding in `provides()`. The **Application** won't boot it until something actually resolves that binding from the container."

## Flagged ambiguities

- "Repository" was used as a synonym for **ConfigRepository** — resolved: always say **ConfigRepository**; "Repository" is too generic.
- "intake" appears as a module name in `src/config/intake.ts` — resolved: not a domain term; the module will be renamed (see `.scratch/rename-intake/`).
- **StorageManager** and **CacheManager** were described as structurally identical — resolved: they share the same adapter shape today, but **CacheManager** is intentionally separate because it will add TTL and eviction (see `.scratch/cache-ttl-eviction/`).
