# Store

**StoreManager** is an abstraction over persistent storage backends. Unlike **CacheManager**, values have no TTL — the Store is for durable key-value data.

Register it by including `StoreProvider` in your providers (or use the built-in `defaultProviders`):

```typescript
import { Application, defaultProviders } from "@raubjo/architect-core"

Application.configure().withProviders(defaultProviders).run()
```

## Basic usage

```typescript
import { Store } from "@raubjo/architect-core/support/facades"

await Store.set("theme", "dark")
const theme = await Store.get<string>("theme")   // "dark" | null
const exists = await Store.has("theme")          // true
await Store.delete("theme")
await Store.clear()
const keys = await Store.keys()
```

## Drivers

| Driver | Backed by | Notes |
|--------|-----------|-------|
| `memory` | In-memory `Map` | Default. Lost on page reload. |
| `local` | `localStorage` | Survives reload. Falls back to `memory` if unavailable. |
| `indexed` | IndexedDB | Larger capacity. Falls back to `memory` if unavailable. |

## Switching drivers

```typescript
Store.use("indexed")

// Access a specific driver directly
const local = Store.driver("local")
await local.set("key", value)
```

## Configuration

```typescript
Application.configure({
  config: {
    store: {
      default: "indexed",
      stores: {
        indexed: { driver: "indexed" },
        local: { driver: "local" },
      },
    },
  },
})
```

## Registering a custom driver

```typescript
import StoreManager from "@raubjo/architect-core"

boot({ container }) {
  const store = container.make(StoreManager)

  store.extend("native", (config) => {
    return new TauriStoreAdapter(config.get("store.stores.native"))
  })
}
```

## Adapters

You can use the built-in adapters directly if you need a raw storage layer without the manager:

```typescript
import {
  MemoryStoreAdapter,
  LocalStorageAdapter,
  IndexedDbAdapter,
} from "@raubjo/architect-core"

const memory = new MemoryStoreAdapter()
const local = new LocalStorageAdapter(window.localStorage)
const indexed = new IndexedDbAdapter()

await memory.set("key", value)
const result = await memory.get("key")
```

### IndexedDbAdapter options

```typescript
const indexed = new IndexedDbAdapter({
  name: "my-app-store",       // database name (default: "ioc-store")
  factory: globalThis.indexedDB,  // IDBFactory (default: globalThis.indexedDB)
  fallback: new MemoryStoreAdapter(), // fallback when IDB unavailable
})
```
