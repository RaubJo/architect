# Service Container

The **Service Container** is a powerful tool for managing class dependencies and performing dependency injection — matching the role of Laravel's service container. The built-in implementation (**BuiltinContainer**) resolves constructor dependencies automatically using TypeScript's `design:paramtypes` reflection metadata. Enable it in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

And import `reflect-metadata` once at your entry point:

```typescript
import "reflect-metadata"
```

## Binding

### Singleton

Resolved once; the same instance is returned on every subsequent `make()`.

```typescript
container.singleton(UserRepository, UserRepository)
```

### Transient

A new instance is created on every `make()`.

```typescript
container.bind(RequestHandler, RequestHandler)
```

### Constant value

Registers an existing value directly. Use this for configuration objects, third-party instances, or anything already constructed.

```typescript
container.instance(ApiConfig, { url: "https://api.example.com", timeout: 5000 })
```

### Fluent binding

The fluent API gives you more control over scope and factory behaviour:

```typescript
// Bind to a class with explicit scope
container.bind(MyService).to(MyServiceImpl).inSingletonScope()
container.bind(MyService).to(MyServiceImpl).inTransientScope()

// Bind to a constant value
container.bind("config.url").toConstantValue("https://api.example.com")

// Bind to a factory that receives the container
container.bind(MyService).toDynamicValue(({ container }) => {
  const config = container.make(ApiConfig)
  return new MyService(config.url)
})
```

## Resolving

```typescript
const service = container.make(UserRepository)

// Alias
const service = container.get(UserRepository)
```

## Identifiers

Bindings can be keyed by class, string, or symbol:

```typescript
container.singleton(UserRepository, UserRepository)         // class key
container.instance("api.url", "https://api.example.com")   // string key
container.instance(Symbol("db"), connection)               // symbol key
```

## Auto-wiring

When you bind a class, the container reads its constructor parameter types from metadata and resolves each one automatically:

```typescript
class ApiClient {
  constructor(private config: ApiConfig, private logger: Logger) {}
}

container.singleton(ApiConfig, ApiConfig)
container.singleton(Logger, Logger)
container.singleton(ApiClient, ApiClient)

// ApiConfig and Logger are injected automatically
const client = container.make(ApiClient)
```

## Manual injection tokens

When a constructor parameter is typed as an interface or primitive, metadata can't infer the token. Use `@inject()` to specify it explicitly:

```typescript
import { inject } from "@raubjo/architect-core"

class ApiClient {
  constructor(
    @inject("api.url") private url: string,
    private logger: Logger,
  ) {}
}
```

## Checking bindings

```typescript
container.bound(UserRepository)  // true / false
container.has("api.url")         // alias for bound()
```
