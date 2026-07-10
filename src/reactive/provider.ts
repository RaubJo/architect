import { proxy } from "valtio/vanilla"
import type { Container } from "../container/contract"
import ServiceProvider from "../support/service-provider"

export default class ReactiveProvider extends ServiceProvider {
    register(container: Container): void {
        // Wrap anything tagged as reactive in a proxy before going to the container.
        container.extendTag("reactive", (value: object) => proxy(value))
    }
}
