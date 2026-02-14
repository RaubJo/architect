import "reflect-metadata";
import { Application } from "@raubjo/architect-core";
import { Renderer as SvelteRenderer } from "@raubjo/architect-core/svelte";
import App from "./app.svelte";
import CounterProvider from "./counter/provider";
import HeartbeatProvider from "./heartbeat/provider";

Application.configure({
  container: { adapter: "builtin" },
  config: {
    app: { name: "Simple Svelte" },
  },
})
  .withProviders([new CounterProvider(), new HeartbeatProvider()])
  .withRoot(App)
  .withRenderer(new SvelteRenderer())
  .run();
