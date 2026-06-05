# Framework Adapters

Architect provides adapters for React, Vue, Solid, and Svelte. Each adapter integrates the Application container with the framework's component tree so any component can resolve services without prop-drilling.

## React

```bash
npm install @raubjo/architect-core react
```

With JSX (`main.tsx`):

```tsx
import "reflect-metadata"
import React from "react"
import ReactDOM from "react-dom/client"
import { Application } from "@raubjo/architect-core"
import { ContextProvider } from "@raubjo/architect-core/react"
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
import { Application } from "@raubjo/architect-core"
import { ContextProvider } from "@raubjo/architect-core/react"
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
import { useService } from "@raubjo/architect-core/react"
import { UserService } from "./services/user"

function Profile() {
  const userService = useService(UserService)
  // ...
}
```

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
npm install @raubjo/architect-core vue
```

```typescript
import "reflect-metadata"
import { createApp, createElement } from "vue"
import { Application } from "@raubjo/architect-core"
import { ContextProvider } from "@raubjo/architect-core/vue"
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
import { containerKey } from "@raubjo/architect-core/vue"
import { UserService } from "./services/user"

const container = inject(containerKey)!
const userService = container.make(UserService)
```

## Solid

```bash
npm install @raubjo/architect-core solid-js
```

```typescript
import "reflect-metadata"
import { render } from "solid-js/web"
import { Application } from "@raubjo/architect-core"
import { ContextProvider } from "@raubjo/architect-core/solid"

const application = Application.configure()
  .withProviders([new AppProvider()])

render(
  () => <ContextProvider application={application}><App /></ContextProvider>,
  document.getElementById("root")!
)
```

## Svelte

```bash
npm install @raubjo/architect-core svelte
```

```svelte
<script lang="ts">
  import { Application } from "@raubjo/architect-core"
  import { ContextProvider } from "@raubjo/architect-core/svelte"
  import App from "./App.svelte"

  const application = Application.configure()
    .withProviders([new AppProvider()])
</script>

<ContextProvider {application}>
  <App />
</ContextProvider>
```
