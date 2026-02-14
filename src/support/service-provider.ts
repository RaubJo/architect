import type { ContainerContract } from "../container/contract";

export type Cleanup = () => void;

export type ServiceProviderContext = {
    container: ContainerContract;
};

export default class ServiceProvider {
    constructor() {}

    register(_context: ServiceProviderContext): void | Cleanup {}

    boot(_context: ServiceProviderContext): void | Cleanup {}
}

export class DeferrableServiceProvider extends ServiceProvider {
    constructor() {
        super();
    }

    provides(): Array<string> {
        return [];
    }
}
