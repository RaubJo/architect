import "reflect-metadata";
import { Application } from "@raubjo/architect-core";
import { Renderer } from "@raubjo/architect-core/react";

import App from "./app";
import Counter from "./counter/provider";
import Heartbeat from "./heartbeat/provider";

Application.configure({
        container: {
            adapter: "builtin"
        },
        config: {
            app: {
                name: "Simple React"
            },
        },
    })
    .withProviders([
        new Counter(),
        new Heartbeat(),
    ])
    .withRoot(App)
    .withRenderer(new Renderer())
    .run();
