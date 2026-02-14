import type {
    Cleanup,
    ServiceProviderContext,
} from "../support/service-provider";

export type RootComponent = unknown;

export type RendererContext = ServiceProviderContext & {
    RootComponent: RootComponent;
    rootElementId: string;
};

export default interface Contract {
    render(context: RendererContext): void | Cleanup;
}
