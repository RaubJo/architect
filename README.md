# @raubjo/architect-core

A Laravel-inspired application container for reactive frontends.

The goal is simple: define and configure business rules in providers, then resolve services where you need them without rebuilding wiring at each call site.

You keep inversion of control, lifecycle hooks, and runtime reactivity.

## This package provides:

- Centralized service registration via providers
- Predictable lifecycle (`register` then `boot`)
- Framework runtime helpers (`react`, `solid`, `svelte`, `vue`)
- Config repository and facades

If you are familiar with Laravel service providers and container bindings, this should feel familiar.

## Install

```sh
bun add @raubjo/architect-core
```

If you want the Inversify adapter:

```sh
bun add inversify 
```

For framework-specific runtime helpers, import from subpaths like `@raubjo/architect-core/react`.

## Quick start

```ts
import { Application } from "@raubjo/architect-core";

const { container, stop } = Application.configure({
  config: {
    app: { name: "IOC Application" },
  },
})
  .withProviders([])
  .run();

// Resolve anywhere after run()
const config = container.get("config");

// Call on teardown if needed
stop();
```

## Container adapters

`Application` supports three container adapter modes:

- `builtin`: always use the built-in container implementation.
- `inversify`: require and use the registered Inversify adapter.
- `auto`: use Inversify when available, otherwise fallback to `builtin`.

### Builtin container

Builtin is the default/fallback container and supports:

- Constructor injection via `design:paramtypes` metadata
- `@inject(...)` parameter token overrides
- `singleton`, `transient`, and `instance` registration
- Fluent `bind(...).to(...)/toDynamicValue(...)/toConstantValue(...)`

```ts
import "reflect-metadata";
import { Application, injectDependency } from "@raubjo/architect-core";

class Logger {}

class Service {
  constructor(
    public readonly logger: Logger,
    @injectDependency("config.appName") public readonly appName: string,
  ) {}
}

const { container } = Application.configure({
  container: { adapter: "builtin" },
  config: {
    appName: "IOC Application",
  },
})
  .withServices(({ container }) => {
    container.singleton(Logger, Logger);
    container.transient(Service, Service);
    container.instance("config.appName", "IOC Application");
  })
  .run();

const service = container.make(Service);
```

### Inversify container

To use Inversify, install `inversify` and `reflect-metadata`, then register a factory on `globalThis.__iocContainerFactoryRegistry`.

```ts
import "reflect-metadata";
import { Application } from "@raubjo/architect-core";
import InversifyContainer from "@raubjo/architect-core/container/adapters/inversify";

globalThis.__iocContainerFactoryRegistry = {
  inversify: () => new InversifyContainer(),
};

const running = Application.configure({
  container: { adapter: "inversify" },
  config: {
    app: { name: "IOC Application" },
  },
}).run();
```

You can also keep `adapter: "auto"` and let runtime detection pick Inversify when `package.json` includes it.

## Service provider example

Use providers to define business rules and service construction once.

```ts
import { injectable } from "inversify";
import {
  ServiceProvider,
  type ServiceProviderContext,
} from "@raubjo/architect-core";

@injectable()
class PricingService {
  constructor(private readonly taxRate: number) {}

  quote(subtotal: number) {
    return subtotal + subtotal * this.taxRate;
  }
}

class PricingServiceProvider extends ServiceProvider {
  register({ container }: ServiceProviderContext) {
    container.bind("services.pricing").toDynamicValue((ctx) => {
      const config = ctx.container.get("config") as {
        float: (key: string, defaultValue?: number) => number;
      };

      const taxRate = config.float("pricing.taxRate", 0.07);
      return new PricingService(taxRate);
    });
  }

  boot({ container }: ServiceProviderContext) {
    // Optional startup work after all providers register.
    // Example: warm caches, subscribe to events, etc.
    void container;
  }
}
```

## Application configuration example

```ts
import "reflect-metadata";
import { Application } from "@raubjo/architect-core";
import { Renderer as ReactRenderer, useService } from "@raubjo/architect-core/react";
import PricingServiceProvider from "./providers/pricing-service-provider";

function QuotePanel() {
  const pricing = useService<{ quote: (subtotal: number) => number }>(
    "services.pricing",
  );

  return <div>Total: {pricing.quote(100)}</div>;
}

const app = Application.configure("./")
  .withProviders([new PricingServiceProvider()])
  .withServices(({ container }) => {
    // Optional inline registrations if you do not want a dedicated provider.
    container.bind("featureFlags.checkout").toConstantValue(true);
  })
  .withRoot(QuotePanel)
  .withRenderer(new ReactRenderer());

app.run();
```

## Config

`Application` uses config passed directly to `configure`:

```ts
const app = Application.configure({
  config: {
    pricing: { taxRate: 0.0825, currency: "USD" },
  },
}).run();
```

## Lifecycle order

`run()` executes in this order:

1. Provider `register()`
2. `.withServices(...)` callbacks
3. Provider `boot()`
4. `.withStartup(...)` callbacks
5. Renderer mount (if configured)

Cleanup runs in reverse order when `stop()` is called.

## Notes

- `Application.make(...)` is available after `run()` and resolves from the active container.
- `Application.configure(basePath)` is still supported for compatibility, but config values should be passed via `configure({ config })`.
