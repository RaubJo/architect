# Deferrable Providers

`DeferrableServiceProvider` extends `ServiceProvider` with one extra method:

```typescript
export class DeferrableServiceProvider extends ServiceProvider {
  provides(): string[] {
    return []
  }
}
```

**This is currently a stub.** `Application.run()` calls `register()` then `boot()` on every provider unconditionally — deferrable or not — in the order they were added. Nothing in the runtime reads `provides()` yet, so a `DeferrableServiceProvider` boots exactly as eagerly as a regular `ServiceProvider`. There is no deferred-loading behavior to opt into today.

## Using it today

Since it behaves identically to `ServiceProvider`, there's no reason to reach for `DeferrableServiceProvider` right now — use the regular base class:

```typescript
import { ServiceProvider, type ContainerContract as Container } from "@raubjo/architect"

export class ReportingProvider extends ServiceProvider {
  register(container: Container): void {
    container.singleton("reporting", ReportingService)
  }

  boot(container: Container): void {
    container.make(ReportingService).connect()
  }
}
```

## Intended shape

The `provides()` list is meant to declare which bindings a provider owns, so the Application can skip `boot()` until one of them is actually resolved — useful for services with expensive `boot()` work (network connections, large allocations) that aren't needed in every session. If and when that lands, this page will show the deferred contract; until then, treat `provides()` as inert.
