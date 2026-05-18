import "reflect-metadata";
import { Application } from "@raubjo/architect-core";
import { ContextProvider } from "@raubjo/architect-core/vue";
import { createApp, h } from "vue";
import App from "./app.vue";
import CounterProvider from "./counter/provider";
import HeartbeatProvider from "./heartbeat/provider";

const application = Application.configure({
  container: { adapter: "builtin" },
  config: {
    app: { name: "Simple Vue" },
  },
})
  .withProviders([new CounterProvider(), new HeartbeatProvider()]);

createApp({
  render: () => h(ContextProvider, { application }, () => h(App)),
}).mount("#root");
