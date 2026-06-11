# Facades

A **Facade** is a static proxy that forwards calls to a service resolved from the container. Facades are safe to use from `boot()` hooks onward — calling one before the Application has run throws.

## Built-in facades

| Facade | Proxies | Import |
|--------|---------|--------|
| `Config` | `ConfigRepository` | `@raubjo/architect/support/facades` |
| `Cache` | `CacheManager` | `@raubjo/architect/support/facades` |
| `Store` | `StoreManager` | `@raubjo/architect/support/facades` |
| `Event` | `Bus` | `@raubjo/architect/support/facades` |

```typescript
import { Config, Cache, Store, Event } from "@raubjo/architect/support/facades"
```

## Creating a custom facade

```typescript
import { createFacade } from "@raubjo/architect/facade"
import type MyService from "./my-service"

export const MyFacade = createFacade<MyService>("my-service")
```

The string `"my-service"` is the container binding key. Bind it in a ServiceProvider:

```typescript
register({ container }) {
  container.singleton("my-service", MyService)
}
```

## Macros

A **Macro** is a named function added to a Facade at runtime. It takes precedence over instance methods of the same name.

```typescript
import { Config } from "@raubjo/architect/facades"

Config.macro("required", (instance, key: string) => {
  const value = instance.get(key)
  if (value === null) throw new Error(`Config key "${key}" is required.`)
  return value
})

// Now callable as a regular method
const name = Config.required("app.name")
```

The macro receives the resolved service instance as its first argument, followed by any arguments passed at the call site.

### Scoping

Macros are scoped per facade — a macro on `Config` does not appear on `Cache`.

### Checking and removing macros

```typescript
Config.hasMacro("required")  // true
Config.flushMacros()         // remove all macros from this facade
```

## Instance caching

Facades cache the resolved service instance after first use. The cache is cleared automatically on Application shutdown and when the Application is re-started.

If you need to force re-resolution (e.g. in tests):

```typescript
import { clearFacadeCache } from "@raubjo/architect/facade"

clearFacadeCache()
```
