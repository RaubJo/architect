# Quick Start

This example wires up two services and mounts a React app. The same pattern applies to any framework.

```typescript
import "reflect-metadata"
import { Application, ServiceProvider } from "@raubjo/architect-core"
import { ContextProvider } from "@raubjo/architect-core/react"
import { createRoot } from "react-dom/client"
import { createElement } from "react"
import App from "./App"

class ApiServiceProvider extends ServiceProvider {
  register({ container }) {
    container.singleton(ApiClient, ApiClient)
  }

  boot({ container }) {
    const client = container.make(ApiClient)
    client.connect()

    return () => client.disconnect()
  }
}

const application = Application.configure({
  config: { api: { url: "https://api.example.com" } },
}).withProviders([new ApiServiceProvider()])

const root = createRoot(document.getElementById("root")!)
root.render(createElement(ContextProvider, { application }, createElement(App)))
```

The **Lifecycle** runs in this order every time:

1. `register()` on every **ServiceProvider** — bindings only, no resolving
2. `boot()` on every **ServiceProvider** — safe to resolve any binding
3. Framework renders the root component
4. On `beforeunload`, cleanup functions run in reverse order

That's all there is to it. The rest of this guide covers each piece in depth.
