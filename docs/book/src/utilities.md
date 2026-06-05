# Utilities

Architect ships several Laravel-inspired utility classes. Each is a separate subpath export — import only what you use.

## Str

String manipulation utilities, matching Laravel's `Str` helper. All methods are static functions on the `Str` object.

```typescript
import { Str } from "@raubjo/architect-core"

Str.slug("Hello World")              // "hello-world"
Str.camel("user_created")            // "userCreated"
Str.snake("UserCreated")             // "user_created"
Str.kebab("UserCreated")             // "user-created"
Str.studly("user_created")           // "UserCreated"
Str.title("hello world")             // "Hello World"
Str.headline("user_created_event")   // "User Created Event"
Str.limit("Long sentence here", 10)  // "Long sente..."
Str.lower("HELLO")                   // "hello"
Str.upper("hello")                   // "HELLO"
Str.random(16)                       // random alphanumeric string
Str.contains("hello world", "world") // true
Str.startsWith("hello", "hel")       // true
Str.endsWith("hello", "llo")         // true
Str.replace("world", "there", "hello world") // "hello there"
Str.slug("Héllo Wörld")              // "hello-world"
Str.trim("  hello  ")               // "hello"
Str.squish("hello   world")          // "hello world"
Str.after("user@example.com", "@")   // "example.com"
Str.before("user@example.com", "@")  // "user"
Str.between("<div>", "<", ">")       // "div"
Str.wordCount("hello world")         // 2
Str.isUrl("https://example.com")     // true
Str.isJson('{"key":"value"}')        // true
Str.toBase64("hello")                // "aGVsbG8="
Str.fromBase64("aGVsbG8=")           // "hello"
```

`registerGlobalHelpers()` makes any utility available on `globalThis` so it's accessible anywhere without importing. Pass only what you need — anything you don't import is treeshaken out of the bundle:

```typescript
import { registerGlobalHelpers, Str, Num, Arr } from "@raubjo/architect-core"

registerGlobalHelpers({ Str, Num, Arr })

// Anywhere in the app, no import needed:
Str.slug("Hello World")
Num.currency(9.99, "USD")
```

The object shorthand `{ Str, Num, Arr }` uses the variable names as the keys on `globalThis`. You can rename a helper if needed:

```typescript
registerGlobalHelpers({ S: Str }) // → globalThis.S
```

## Arr

Array utilities, matching Laravel's `Arr` helper:

```typescript
import { Arr } from "@raubjo/architect-core"

Arr.wrap("hello")          // ["hello"]
Arr.wrap(["hello"])        // ["hello"]
Arr.wrap(null)             // []

Arr.flatten([[1, 2], [3]]) // [1, 2, 3]
Arr.unique([1, 2, 2, 3])   // [1, 2, 3]
Arr.first([1, 2, 3])       // 1
Arr.last([1, 2, 3])        // 3
Arr.chunk([1, 2, 3, 4], 2) // [[1, 2], [3, 4]]

const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
]

Arr.pluck(users, "name")   // ["Alice", "Bob"]
Arr.keyBy(users, "id")     // { 1: { id: 1, name: "Alice" }, 2: { ... } }
```

## Num

Number formatting utilities, matching Laravel's `Number` helper:

```typescript
import { Num } from "@raubjo/architect-core"

Num.format(1234567.89)          // "1,234,567.89"
Num.format(1234.5, 2)           // "1,234.50"
Num.currency(9.99, "USD")       // "$9.99"
Num.currency(9.99, "EUR", "de") // "9,99 €"
Num.percentage(75)              // "75%"
Num.percentage(33.3, 1)         // "33.3%"
Num.fileSize(1536)              // "2 KB"
Num.fileSize(1048576, 1)        // "1.0 MB"
Num.abbreviate(1500)            // "2K"
Num.abbreviate(1500000, 1)      // "1.5M"
Num.clamp(150, 0, 100)          // 100
Num.clamp(-5, 0, 100)           // 0
Num.between(5, 1, 10)           // true
Num.between(15, 1, 10)          // false
```

## Collection

An immutable, chainable wrapper around arrays, matching Laravel's `Collection`:

```typescript
import { Collection } from "@raubjo/architect-core"

const users = new Collection([
  { id: 1, name: "Alice", age: 30 },
  { id: 2, name: "Bob", age: 25 },
])

users.filter((u) => u.age > 20).map((u) => u.name).toArray()
// ["Alice", "Bob"]

users.first()              // { id: 1, name: "Alice", age: 30 }
users.last()               // { id: 2, name: "Bob", age: 25 }
users.count()              // 2
users.pluck("name")        // Collection ["Alice", "Bob"]
users.keyBy("id")          // Collection { 1: { ... }, 2: { ... } }
users.groupBy("age")       // Collection { 25: [...], 30: [...] }
users.sum("age")           // 55
users.avg("age")           // 27.5
users.contains("name", "Alice") // true
users.toArray()            // original array
```

## LazyCollection

Like `Collection` but lazily evaluated — values are not computed until you iterate or call `toArray()`. Useful for large datasets where you want to avoid building intermediate arrays:

```typescript
import { LazyCollection } from "@raubjo/architect-core"

const result = new LazyCollection(largeArray)
  .filter((x) => x.active)
  .map((x) => x.id)
  .take(100)
  .toArray()
```

## Fluent

A generic dot-notation key-value wrapper. Useful for wrapping configuration objects or arbitrary records with a clean read/write API:

```typescript
import { Fluent } from "@raubjo/architect-core"

const obj = new Fluent({
  user: { name: "Alice", age: 30 },
  settings: { theme: "dark" },
})

obj.get("user.name")              // "Alice"
obj.get("user.missing", "guest")  // "guest"
obj.get<number>("user.age")       // 30
obj.has("settings.theme")         // true
obj.set("user.age", 31)           // returns this (chainable)
obj.toArray()                     // { user: { name: "Alice", age: 31 }, ... }
```

## Pipeline

Send a value through a series of transform functions, matching Laravel's `Pipeline`:

```typescript
import { send } from "@raubjo/architect-core"

// Each pipe is a function: (passable, next) => result
// Call next(passable) to pass to the next stage.
const validate = (user, next) => {
  if (!user.name) throw new Error("Name is required")
  return next(user)
}

const normalizeEmail = (user, next) => {
  return next({ ...user, email: user.email.toLowerCase() })
}

const result = send(user)
  .through([validate, normalizeEmail])
  .thenReturn()
```

Use `then()` to provide a final destination instead of returning the passable:

```typescript
const result = send(user)
  .through([validate, normalizeEmail])
  .then((user) => repository.save(user))
```

The pipeline is **synchronous**. If you need async pipes, resolve promises inside each pipe before calling `next`.
