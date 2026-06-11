# Service Providers

A **ServiceProvider** is the unit of wiring — a class that encapsulates registration and boot for one feature area. Every service you want in the container gets its own provider.

## Basic structure

```typescript
import { ServiceProvider, type ServiceProviderContext } from "@raubjo/architect"

export class AnalyticsProvider extends ServiceProvider {
  register({ container }: ServiceProviderContext): void {
    container.singleton(AnalyticsService, AnalyticsService)
  }

  boot({ container }: ServiceProviderContext): void | (() => void) {
    const analytics = container.make(AnalyticsService)
    analytics.start()

    return () => analytics.stop()
  }
}
```

## The register / boot contract

`register()` must **only bind** into the container — never resolve. `boot()` may safely resolve any binding because all providers' `register()` calls have completed first.

```typescript
// ✅ correct
register({ container }) {
  container.singleton(MyService, MyService)
}

// ❌ wrong — resolving in register() risks getting undefined
//    if another provider hasn't registered yet
register({ container }) {
  const config = container.make(ConfigRepository) // don't do this
}
```

## Returning a cleanup function

Both `register()` and `boot()` can return a cleanup function. The Application collects these and calls them in reverse order on shutdown.

```typescript
boot({ container }) {
  const poller = container.make(PollingService)
  const interval = setInterval(() => poller.tick(), 5000)

  return () => clearInterval(interval)
}
```

This matches the same convention as React's `useEffect`, Svelte's `onDestroy`, and Vue's `onUnmounted` — providers that don't need cleanup simply return nothing.

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
