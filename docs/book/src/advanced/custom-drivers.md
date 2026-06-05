# Custom Drivers

Both **CacheManager** and **StoreManager** support registering custom drivers via `extend()`. A driver is a named backend — register it from a ServiceProvider's `boot()` hook, where the manager is already bound.

## Custom Store driver

Implement the `StoreAdapter` interface:

```typescript
import type { StoreAdapter } from "@raubjo/architect-core"

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
import { StoreManager, type ServiceProviderContext } from "@raubjo/architect-core"

export class RedisStoreProvider extends ServiceProvider {
  boot({ container }: ServiceProviderContext): void {
    const store = container.make(StoreManager)

    store.extend("redis", (config) => {
      const url = config.get<string>("store.stores.redis.url", "redis://localhost:6379")
      return new RedisAdapter(new RedisClient(url))
    })
  }
}
```

Then configure it as the active driver:

```typescript
Application.configure({
  config: {
    store: {
      default: "redis",
      stores: {
        redis: { driver: "redis", url: "redis://localhost:6379" },
      },
    },
  },
}).withProviders([new RedisStoreProvider()])
```

## Custom Cache driver

Cache drivers use the same `StoreAdapter` interface — the **Cache** TTL wrapper is applied automatically by **CacheManager**. You do not need to implement TTL yourself:

```typescript
import { CacheManager, type ServiceProviderContext } from "@raubjo/architect-core"

export class RedisCacheProvider extends ServiceProvider {
  boot({ container }: ServiceProviderContext): void {
    const cache = container.make(CacheManager)

    cache.extend("redis", (config) => {
      const url = config.get<string>("cache.stores.redis.url")
      return new RedisAdapter(new RedisClient(url))
    })
  }
}
```

## Driver factory signature

The factory callback receives `ConfigRepository` and must return a raw `StoreAdapter`:

```typescript
manager.extend("my-driver", (config: ConfigRepository): StoreAdapter => {
  return new MyAdapter(config.get("store.stores.my-driver"))
})
```

The factory is called **lazily** — only when the driver is first accessed — and the result is cached for subsequent calls.

## Switching drivers at runtime

```typescript
import { Store } from "@raubjo/architect-core/facades"

Store.use("redis")
await Store.set("user:42", userData)

// Switch back
Store.use("memory")
```
