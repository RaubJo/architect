import type { Container } from "../container/contract"
import type { Cleanup } from "../support/service-provider"

export type RootComponent = unknown

export type RendererContext = {
    container: Container
    RootComponent: RootComponent
    rootElementId: string
}

export default interface Contract {
    render(context: RendererContext): void | Cleanup
}
