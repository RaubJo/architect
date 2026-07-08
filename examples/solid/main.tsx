import "reflect-metadata";
import { Application } from "@raubjo/architect";
import { ContextProvider } from "@raubjo/architect/solid";
import { render } from "solid-js/web";
import App from "./app";
import CounterProvider from "./counter/provider";
import HeartbeatProvider from "./heartbeat/provider";

const application = Application.configure({
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
