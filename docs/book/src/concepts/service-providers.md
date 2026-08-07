# Service Providers

A **ServiceProvider** is the unit of wiring — a class that encapsulates registration and boot for one feature area. Every service you want in the container gets its own provider.

## Basic structure

```typescript
import { ServiceProvider, type ContainerContract as Container } from "@raubjo/architect"

export class AnalyticsProvider extends ServiceProvider {
  protected analytics?: AnalyticsService

  register(container: Container): void {
    container.singleton(AnalyticsService, AnalyticsService)
  }

  boot(container: Container): void {
    this.analytics = container.make(AnalyticsService)
    this.analytics.start()
  }

  destroy(): void {
    this.analytics?.stop()
  }
}
```

## The register / boot contract

`register()` must **only bind** into the container — never resolve. `boot()` may safely resolve any binding because all providers' `register()` calls have completed first.

```typescript
// ✅ correct
register(container: Container) {
  container.singleton(MyService, MyService)
}

// ❌ wrong — resolving in register() risks getting undefined
//    if another provider hasn't registered yet
register(container: Container) {
  const config = container.make(ConfigRepository) // don't do this
}
```

## Tearing down with destroy()

`register()` and `boot()` are `void` — there's no return value to track. Tear-down work goes in `destroy()` instead: a separate method the Application calls once per provider, in reverse provider order, on shutdown. Whatever `destroy()` needs (a timer handle, an `AbortController`, a subscription) is tracked as an instance field, since it's no longer passed back through a return value:

```typescript
export class PollingProvider extends ServiceProvider {
  protected interval?: ReturnType<typeof setInterval>

  boot(container: Container): void {
    const poller = container.make(PollingService)
    this.interval = setInterval(() => poller.tick(), 5000)
  }

  destroy(): void {
    clearInterval(this.interval)
  }
}
```

This matches the same convention as React's `useEffect`, Svelte's `onDestroy`, and Vue's `onUnmounted` — providers that don't need cleanup simply don't override `destroy()`.

## Provider ownership

Each **ServiceProvider** is the sole owner of registration, booting, and cleanup for its feature area. No other code should bind or unbind what a provider manages.

## Passing providers

Pass provider instances to `withProviders()`:

```typescript
Application.configure()
  .withProviders([
    new DatabaseProvider(),
    new AuthProvider(),
    new ApiProvider(),
  ])
  .run()
```

Providers run in the order given.
