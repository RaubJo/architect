import "reflect-metadata";
import { Application } from "@raubjo/architect";
import { ContextProvider } from "@raubjo/architect/vue";
import { createApp, h } from "vue";
import App from "./app.vue";

import Counter from "./counter/provider";
import Heartbeat from "./heartbeat/provider";

const application = Application.configure({
    config: {
        app: { name: "Simple Vue" },
    },
    })
    .withProviders([
        new Counter(), 
        new Heartbeat()
    ]);

createApp({
  render: () => h(ContextProvider, { application }, () => h(App)),
}).mount("#root");
