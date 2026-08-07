import type { Container } from "../container/contract"

export type Cleanup = () => void

export default class ServiceProvider {
    register(_container: Container): void {}

    boot(_container: Container): void {}

    /** Called by the Application on shutdown, in reverse provider order. Tear down what boot() started. */
    destroy(_container: Container): void {}
}

export class DeferrableServiceProvider extends ServiceProvider {
    provides(): Array<string> {
        return []
    }
}
