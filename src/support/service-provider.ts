import type { Container } from "../container/contract"

export type Cleanup = () => void

export default class ServiceProvider {
    register(_container: Container): void | Cleanup {}

    boot(_container: Container): void | Cleanup {}
}

export class DeferrableServiceProvider extends ServiceProvider {
    provides(): Array<string> {
        return []
    }
}
