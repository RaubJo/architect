import "reflect-metadata";
import { Application } from "@raubjo/architect-core";
import { Renderer as SolidRenderer } from "@raubjo/architect-core/solid";
import App from "./app";
import CounterProvider from "./counter/provider";
import HeartbeatProvider from "./heartbeat/provider";

Application.configure({
  container: { adapter: "builtin" },
  config: {
    app: { name: "Simple Solid" },
  },
})
  .withProviders([new CounterProvider(), new HeartbeatProvider()])
  .withRoot(App)
  .withRenderer(new SolidRenderer())
  .run();
