import "reflect-metadata";
import { Application } from "@raubjo/architect";
import { ContextProvider } from "@raubjo/architect/react";
import ReactiveProvider from "@raubjo/architect/reactive";
import ReactDOM from "react-dom/client";
import { createElement } from "react";

import App from "./app";
import Counter from "./counter/provider";
import Heartbeat from "./heartbeat/provider";
import Menus from "./menu/provider";

const application = Application.configure({
        config: {
            app: {
                name: "Simple React"
            },
        },
    })
    .withProviders([
        new Counter(),
        new Heartbeat(),
        new Menus(),
        new ReactiveProvider(),
    ]);

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(createElement(ContextProvider, { application }, createElement(App)));
