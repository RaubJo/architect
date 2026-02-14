import { render } from "solid-js/web";
import { createComponent, type JSX } from "solid-js";
import type { Cleanup } from "../../support/service-provider";
import { ApplicationProvider } from "../../runtimes/solid";
import type Contract from "../contract";
import type { RendererContext } from "../contract";

type SolidRootComponent = () => JSX.Element;

export default class SolidRenderer implements Contract {
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

        return render(
            () =>
                createComponent(ApplicationProvider, {
                    container,
                    children: () => (RootComponent as SolidRootComponent)(),
                }),
            mountNode,
        );
    }
}
