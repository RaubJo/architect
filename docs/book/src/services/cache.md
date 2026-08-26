# Cache

**CacheManager** manages TTL-based caching. It wraps raw storage adapters with TTL-aware get/set via the **Cache** layer — values are stored with an expiry timestamp and evicted lazily on read. Not designed as a primary data store.

Register it by including `CacheProvider` in your providers (or use the built-in `defaultProviders`):

```typescript
import { Application, defaultProviders } from "@artisansdk/architect"

Application.configure().withProviders(defaultProviders).run()
```

## Basic usage

```typescript
import { Cache } from "@artisansdk/architect/support/facades"

// Set with no expiry
await Cache.set("user:42", userData)

// Set with TTL in seconds (expires after 5 minutes)
await Cache.set("user:42", userData, 300)

// Set with no expiry explicitly
await Cache.set("user:42", userData, null)

// Get — returns null if missing or expired
const user = await Cache.get<User>("user:42")

// Check existence
const exists = await Cache.has("user:42")

// Delete
await Cache.delete("user:42")

// Clear all entries
await Cache.clear()

// List non-expired keys
const keys = await Cache.keys()
```

## TTL rules

| `ttl` value | Behaviour |
|-------------|-----------|
| `number` | Expires after that many **seconds** |
| `null` | No expiry |
| omitted | No expiry |
| `0` | Expires immediately |

## Drivers

Three drivers are available out of the box:

| Driver | Backed by | Survives reload | Notes |
|--------|-----------|-----------------|-------|
| `memory` | In-memory `Map` | No | Default. |
| `local` | `localStorage` | Yes | Falls back to `memory` if unavailable. |
| `indexed` | IndexedDB | Yes | Larger capacity. Falls back to `memory` if unavailable. |

With `local` and `indexed` drivers, cached values survive page reload — but TTL expiry is still enforced on read. A value set with a 5-minute TTL will be evicted the first time it is read after those 5 minutes, regardless of reload.

## Switching drivers

```typescript
// Switch the active driver
Cache.use("local")

// Access a specific driver's store directly
const memoryStore = Cache.store("memory")
await memoryStore.set("key", value)
```

## Configuration

```typescript
Application.configure({
  config: {
    cache: {
      default: "local",
      stores: {
        local: { driver: "local" },
        fast: { driver: "memory" },
      },
    },
  },
})
```

## Registering a custom driver

Register custom drivers from a ServiceProvider's `boot()` hook. The factory receives `ConfigRepository` and must return a raw storage **Adapter**:

```typescript
import { CacheManager, type ContainerContract as Container } from "@artisansdk/architect"

boot(container: Container) {
  const manager = container.make(CacheManager)

  manager.extend("redis", (config) => {
    return new RedisAdapter(config.get("cache.stores.redis"))
  })
}
```

## Using CacheManager directly

```typescript
import { CacheManager, type ContainerContract as Container } from "@artisansdk/architect"

boot(container: Container) {
  const cache = container.make(CacheManager)
  await cache.set("session", token, 3600)
}
```
