# Framework Adapters

Architect provides adapters for React, Vue, Solid, and Svelte. Each adapter integrates the Application container with the framework's component tree so any component can resolve services without prop-drilling.

## React

```bash
npm install @raubjo/architect react
```

With JSX (`main.tsx`):

```tsx
import "reflect-metadata"
import React from "react"
import ReactDOM from "react-dom/client"
import { Application } from "@raubjo/architect"
import { ContextProvider } from "@raubjo/architect/react"
import App from "./App"

const app = Application.configure()
  .withProviders([new AppProvider()])

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ContextProvider application={app}>
      <App />
    </ContextProvider>
  </React.StrictMode>
)
```

Without JSX (`main.ts`):

```typescript
import "reflect-metadata"
import { createElement } from "react"
import { createRoot } from "react-dom/client"
import { Application } from "@raubjo/architect"
import { ContextProvider } from "@raubjo/architect/react"
import App from "./App"

const app = Application.configure()
  .withProviders([new AppProvider()])

const root = createRoot(document.getElementById("root")!)
root.render(
  createElement(ContextProvider, { application: app }, createElement(App))
)
```

### Resolving services in components

```tsx
import { useService } from "@raubjo/architect/react"
import { UserService } from "./services/user"

function Profile() {
  const userService = useService(UserService)
  // ...
}
```

### Reactive services

Bindings registered with `container.reactive(...)` (see [Container](./concepts/container.md#reactive)) are automatically subscribed to — `useService` detects the `"reactive"` tag and wraps the result in Valtio's `useProxy`, so the component re-renders on mutation with no extra code:

```tsx
// provider
container.reactive(Menu, Menu)

// component — mutating menu re-renders this component, same call as any other service
const menu = useService(Menu)
```

Services registered with `bind`/`singleton` are returned as-is; use component state, signals, or another framework mechanism for those.

### Using an existing container

If you already have a container (e.g. in tests or SSR), pass it directly:

```tsx
<ContextProvider container={myContainer}>
  <App />
</ContextProvider>
```

### Hooks

| Hook | Description |
|------|-------------|
| `useService(Token)` | Resolve a binding from the Service Container |
| `useContainer()` | Access the raw `ContainerContract` |

## Vue

```bash
npm install @raubjo/architect vue
```

```typescript
import "reflect-metadata"
import { createApp, createElement } from "vue"
import { Application } from "@raubjo/architect"
import { ContextProvider } from "@raubjo/architect/vue"
import App from "./App.vue"

const application = Application.configure()
  .withProviders([new AppProvider()])

createApp(ContextProvider, { application })
  .component("App", App)
  .mount("#root")
```

### Injecting services in components

```typescript
import { inject } from "vue"
import { containerKey } from "@raubjo/architect/vue"
import { UserService } from "./services/user"

const container = inject(containerKey)!
const userService = container.make(UserService)
```

## Solid

```bash
npm install @raubjo/architect solid-js
```

```typescript
import "reflect-metadata"
import { render } from "solid-js/web"
import { Application } from "@raubjo/architect"
import { ContextProvider } from "@raubjo/architect/solid"

const application = Application.configure()
  .withProviders([new AppProvider()])

render(
  () => <ContextProvider application={application}><App /></ContextProvider>,
  document.getElementById("root")!
)
```

## Svelte

```bash
npm install @raubjo/architect svelte
```

```svelte
<script lang="ts">
  import { Application } from "@raubjo/architect"
  import { ContextProvider } from "@raubjo/architect/svelte"
  import App from "./App.svelte"

  const application = Application.configure()
    .withProviders([new AppProvider()])
</script>

<ContextProvider {application}>
  <App />
</ContextProvider>
```
