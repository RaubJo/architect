import "reflect-metadata";
import { Application } from "@raubjo/architect-core";
import { Renderer as VueRenderer } from "@raubjo/architect-core/vue";
import App from "./app.vue";
import CounterProvider from "./counter/provider";
import HeartbeatProvider from "./heartbeat/provider";

Application.configure({
  container: { adapter: "builtin" },
  config: {
    app: { name: "Simple Vue" },
  },
})
  .withProviders([new CounterProvider(), new HeartbeatProvider()])
  .withRoot(App)
  .withRenderer(new VueRenderer())
  .run();
