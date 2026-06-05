# Deferrable Providers

A **DeferrableServiceProvider** declares which container bindings it provides via `provides()`. The Application skips booting it entirely until one of those bindings is actually resolved from the container — an optimization for services that aren't always needed.

## Basic usage

```typescript
import { DeferrableServiceProvider, type ServiceProviderContext } from "@raubjo/architect-core"

export class ReportingProvider extends DeferrableServiceProvider {
  provides(): string[] {
    return ["reporting", "reporting.exporter"]
  }

  register({ container }: ServiceProviderContext): void {
    container.singleton("reporting", ReportingService)
    container.singleton("reporting.exporter", PdfExporter)
  }

  boot({ container }: ServiceProviderContext): void {
    // Heavy initialization only runs if "reporting" or "reporting.exporter"
    // is actually resolved
    container.make(ReportingService).connect()
  }
}
```

Register it the same way as any other provider:

```typescript
Application.configure()
  .withProviders([new ReportingProvider()])
  .run()
```

## When to use it

Use a `DeferrableServiceProvider` when:

- The service does expensive initialization in `boot()` (network connections, large allocations)
- The service is only needed on certain routes or user flows
- You want to avoid paying boot cost for services that may never be used in a given session

## When not to use it

If the service is always resolved (e.g. bound to a component that renders on every page), deferral adds overhead with no benefit. Use a regular `ServiceProvider` instead.

## Caveats

The `provides()` list must be exhaustive. If a binding is registered in `register()` but not listed in `provides()`, it will be treated as undeferred and the provider will be booted eagerly.

Class-based identifiers are not supported in `provides()` — use string keys for deferrable bindings:

```typescript
// ✅
provides() { return ["reporting"] }
register({ container }) { container.singleton("reporting", ReportingService) }

// ❌ class keys cannot be declared in provides()
provides() { return [ReportingService] }
```
