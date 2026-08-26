# Custom Drivers

Both **CacheManager** and **StoreManager** support registering custom drivers via `extend()`. A driver is a named backend — register it from a ServiceProvider's `boot()` hook, where the manager is already bound.

## Custom Store driver

Implement the `StoreAdapter` interface:

```typescript
import type { StoreAdapter } from "@artisansdk/architect"

class RedisAdapter implements StoreAdapter {
  constructor(private client: RedisClient) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key)
    return value === null ? null : JSON.parse(value)
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.client.set(key, JSON.stringify(value))
  }

  async has(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key)
  }

  async clear(): Promise<void> {
    await this.client.flushDb()
  }

  async keys(): Promise<string[]> {
    return this.client.keys("*")
  }
}
```

Register it in a ServiceProvider:

```typescript
import { ServiceProvider, StoreManager, type ContainerContract as Container } from "@artisansdk/architect"

export class RedisStoreProvider extends ServiceProvider {
  boot(container: Container): void {
    // StoreManager isn't bound by class — only the string identifier "store" is registered.
    const store = container.make<StoreManager>("store")

    store.extend("redis", (config) => {
      const url = config.get<string>("store.redis.url", "redis://localhost:6379")
      return new RedisAdapter(new RedisClient(url))
    })
  }
}
```

Then configure it as the active driver. Unlike **CacheManager**, `StoreManager` has no `stores` map in its config shape — it reads a single flat `store.driver` key, and any config a custom driver's factory needs is just a plain key you choose and read back yourself:

```typescript
Application.configure({
  config: {
    store: {
      driver: "redis",
      redis: { url: "redis://localhost:6379" },
    },
  },
}).withProviders([new RedisStoreProvider()])
```

## Custom Cache driver

Cache drivers use the same `StoreAdapter` interface — the **Cache** TTL wrapper is applied automatically by **CacheManager**. You do not need to implement TTL yourself:

```typescript
import { ServiceProvider, CacheManager, type ContainerContract as Container } from "@artisansdk/architect"

export class RedisCacheProvider extends ServiceProvider {
  boot(container: Container): void {
    const cache = container.make(CacheManager)

    cache.extend("redis", (config) => {
      const url = config.get<string>("cache.stores.redis.url")
      return new RedisAdapter(new RedisClient(url))
    })
  }
}
```

Set `cache.default: "redis"` (or call `Cache.use("redis")` later) to activate it — `cache.stores.redis` here is just where this example chose to stash the driver's own config; `CacheManager` only reads `.driver` out of `cache.stores` entries for its three built-in drivers, so a custom driver's config path is otherwise up to you, same as `StoreManager` above.

## Driver factory signature

The factory callback receives `ConfigRepository` and must return a raw `StoreAdapter`:

```typescript
manager.extend("my-driver", (config: ConfigRepository): StoreAdapter => {
  return new MyAdapter(config.get("store.my-driver"))
})
```

The factory is called **lazily** — only when the driver is first accessed — and the result is cached for subsequent calls.

## Switching drivers at runtime

```typescript
import { Store } from "@artisansdk/architect/facades"

Store.use("redis")
await Store.set("user:42", userData)

// Switch back
Store.use("memory")
```
