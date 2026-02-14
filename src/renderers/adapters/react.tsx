import ReactDOM from "react-dom/client";
import { createElement } from "react";
import type { ReactElement } from "react";
import { ApplicationProvider } from "../../runtimes/react";
import type Contract from "../contract";
import type { RendererContext } from "../contract";
import type { Cleanup } from "../../support/service-provider";

type ReactRootComponent = () => ReactElement | null;

export default class ReactRenderer implements Contract {
    constructor() {}

    render({
        RootComponent,
        container,
        rootElementId,
    }: RendererContext): Cleanup {
        const mountNode = document.getElementById(rootElementId);
        if (!mountNode) {
            throw new Error(`Missing mount node #${rootElementId}.`);
        }

        const root = ReactDOM.createRoot(mountNode);
        root.render(
            createElement(
                ApplicationProvider,
                { container },
                createElement(RootComponent as ReactRootComponent),
            ),
        );

        return () => root.unmount();
    }
}
