import { createApp, type Component } from "vue";
import type { Cleanup } from "../../support/service-provider";
import { containerKey } from "../../runtimes/vue";
import type Contract from "../contract";
import type { RendererContext } from "../contract";

type VueRootComponent = Component;

export default class VueRenderer implements Contract {
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

        const app = createApp(RootComponent as VueRootComponent);
        app.provide(containerKey, container);
        app.mount(mountNode);

        return () => app.unmount();
    }
}
