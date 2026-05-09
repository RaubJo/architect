import type { ContainerContract } from "../container/contract"

export type Cleanup = () => void

export type ServiceProviderContext = {
    container: ContainerContract
}

export default class ServiceProvider {
    register(_context: ServiceProviderContext): void | Cleanup {}

    boot(_context: ServiceProviderContext): void | Cleanup {}
}

export class DeferrableServiceProvider extends ServiceProvider {
    provides(): Array<string> {
        return []
    }
}
