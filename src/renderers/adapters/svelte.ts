import { mount, unmount } from "svelte";
import type { Cleanup } from "../../support/service-provider";
import type Contract from "../contract";
import type { RendererContext } from "../contract";

type SvelteComponentInstance = {
    $destroy?: () => void;
    destroy?: () => void;
};

type SvelteComponentConstructor = new (options: {
    target: Element;
    props?: Record<string, unknown>;
}) => SvelteComponentInstance;

type SvelteMount = (
    component: unknown,
    options: { target: Element; props?: Record<string, unknown> },
) => unknown;
type SvelteUnmount = (instance: unknown) => void | Promise<void>;

export default class SvelteRenderer implements Contract {
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

        const props = { container };
        const modernCleanup = tryRenderModernSvelte(
            RootComponent,
            mountNode,
            props,
        );

        return modernCleanup ?? renderLegacySvelte(RootComponent, mountNode, props);
    }
}

function tryRenderModernSvelte(
    RootComponent: unknown,
    mountNode: Element,
    props: Record<string, unknown>,
): Cleanup | null {
    const svelteMount = mount as unknown as SvelteMount | undefined;
    const svelteUnmount = unmount as unknown as SvelteUnmount | undefined;

    if (typeof svelteMount !== "function" || typeof svelteUnmount !== "function") {
        return null;
    }

    try {
        const instance = svelteMount(RootComponent, {
            target: mountNode,
            props,
        });

        return () => {
            void svelteUnmount(instance);
        };
    } catch (_error) {
        return null;
    }
}

function renderLegacySvelte(
    RootComponent: unknown,
    mountNode: Element,
    props: Record<string, unknown>,
): Cleanup {
    const Component = RootComponent as SvelteComponentConstructor;
    const instance = new Component({ target: mountNode, props });

    return () => {
        if (typeof instance.$destroy === "function") {
            instance.$destroy();
            return;
        }

        if (typeof instance.destroy === "function") {
            instance.destroy();
        }
    };
}
