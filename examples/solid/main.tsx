import "reflect-metadata";
import { Application } from "@raubjo/architect-core";
import { ContextProvider } from "@raubjo/architect-core/solid";
import { render } from "solid-js/web";
import App from "./app";
import CounterProvider from "./counter/provider";
import HeartbeatProvider from "./heartbeat/provider";

const application = Application.configure({
  container: { adapter: "builtin" },
  config: {
    app: { name: "Simple Solid" },
  },
})
  .withProviders([new CounterProvider(), new HeartbeatProvider()]);

render(() => (
  <ContextProvider application={application}>
    <App />
  </ContextProvider>
), document.getElementById("root")!);
