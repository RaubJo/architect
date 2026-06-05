# Application & Lifecycle

`Application` is the central orchestrator. You configure it with providers and inline config, then call `run()` to start the lifecycle.

## Configuration

```typescript
import { Application } from "@raubjo/architect-core"

const application = Application.configure({
  config: {
    app: { name: "My App" },
    cache: { default: "memory" },
  },
}).withProviders([
  new AuthProvider(),
  new ApiProvider(),
])
```

`Application.configure()` accepts an options object:

| Option | Type | Description |
|--------|------|-------------|
| `config` | `Record<string, unknown>` | Inline config merged with file-based config |
| `basePath` | `string` | Root path for config file discovery (default `"./"`) |
| `container` | `object` | Container adapter options |

## Running

```typescript
const { container, stop } = application.run()
```

`run()` returns `{ container, stop }`. The Application registers a `beforeunload` listener that calls `stop()` automatically, so you rarely need to call it yourself.

## Lifecycle Order

The fixed sequence is:

1. **Register** — every provider's `register()` runs in the order they were added
2. **Boot** — every provider's `boot()` runs after all `register()` calls complete
3. **Shutdown** — cleanup functions collected from `register()` and `boot()` run in reverse order

No phase can be skipped or reordered. This guarantee is why `boot()` can safely resolve any binding — all providers have already registered by the time any `boot()` runs.

## Resolving from outside providers

After `run()`, you can resolve bindings anywhere via the static `Application.make()`:

```typescript
const service = Application.make(MyService)
```

This reads from the current Application's container. It throws if called before `run()`.
