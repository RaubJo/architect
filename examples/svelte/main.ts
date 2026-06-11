import "reflect-metadata";
import { Application } from "@raubjo/architect";
import App from "./app.svelte";
import CounterProvider from "./counter/provider";
import HeartbeatProvider from "./heartbeat/provider";

const application = Application.configure({
  container: { adapter: "builtin" },
  config: {
    app: { name: "Simple Svelte" },
  },
})
  .withProviders([new CounterProvider(), new HeartbeatProvider()]);

const running = application.run();

new App({
  target: document.getElementById("root")!,
  props: { container: running.container },
});

window.addEventListener("beforeunload", running.stop, { once: true });
