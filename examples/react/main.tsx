import "reflect-metadata";
import { Application } from "@raubjo/architect-core";
import { ContextProvider } from "@raubjo/architect-core/react";
import ReactDOM from "react-dom/client";
import { createElement } from "react";

import App from "./app";
import Counter from "./counter/provider";
import Heartbeat from "./heartbeat/provider";

const application = Application.configure({
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
    ]);

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(createElement(ContextProvider, { application }, createElement(App)));
