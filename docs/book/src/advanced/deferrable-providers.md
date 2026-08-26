# Deferrable Providers

A **DeferrableServiceProvider** declares which container bindings it owns via `provides()`. The Application skips `register()` and `boot()` entirely until one of those bindings is actually resolved from the container — an optimization for services that aren't always needed in a given session.

## Basic usage

```typescript
import { DeferrableServiceProvider, type ContainerContract as Container } from "@artisansdk/architect"

export class ReportingProvider extends DeferrableServiceProvider {
  provides(): string[] {
    return ["reporting", "reporting.exporter"]
  }

  register(container: Container): void {
    container.singleton("reporting", ReportingService)
    container.singleton("reporting.exporter", PdfExporter)
  }

  boot(container: Container): void {
    // Only runs the first time "reporting" or "reporting.exporter" is resolved
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

Nothing else changes at the call site — `container.make("reporting")` (directly, via `container.get(...)`, or indirectly through anything that resolves it) transparently triggers `register()` then `boot()` the first time, then resolves normally. Every later resolution of any of the provider's declared identifiers — including the other ones it didn't originally trigger on — hits the real binding directly; `register()`/`boot()` never run twice.

## When to use it

Use a `DeferrableServiceProvider` when:

- The service does expensive initialization in `boot()` (network connections, large allocations)
- The service is only needed on certain routes or user flows
- You want to avoid paying boot cost for services that may never be used in a given session

## When not to use it

If the service is always resolved (e.g. bound to a component that renders on every page), deferral adds overhead with no benefit. Use a regular `ServiceProvider` instead.

## Caveats

**`provides()` must be exhaustive.** Only the identifiers it lists get the lazy hook. If `register()` binds something not listed in `provides()`, that binding simply won't exist until *some* declared identifier is resolved and drags the rest along with it — there's no validation catching an incomplete list.

**An empty `provides()` disables deferral, not the provider.** `DeferrableServiceProvider`'s default `provides()` returns `[]`. With nothing to hook, the Application falls back to booting it eagerly — same as a regular `ServiceProvider` — rather than never booting it at all.

**`bound()`/`has()` don't know about deferred bindings.** Only `make()`/`get()` trigger the lazy boot. `container.bound("reporting")` returns `false` until something has actually resolved it — checking `bound()` first to decide whether to resolve a deferred binding will defeat the deferral (and get the wrong answer).

**`destroy()` only runs for providers that actually booted.** A deferred provider nothing ever resolved never boots, so its `destroy()` is skipped too — there's nothing to tear down. Shutdown order is reverse of *actual boot* order, not registration order: if a deferred provider gets triggered mid-session, well after every eager provider has already booted, it's still destroyed first — same LIFO discipline as eager providers, just anchored to when each one really started.

**Both string and class identifiers work** in `provides()` — whatever `Identifier` accepts elsewhere in the container works here too:

```typescript
provides() { return [ReportingService] }
register(container: Container) { container.singleton(ReportingService, ReportingService) }
```
