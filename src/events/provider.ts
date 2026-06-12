import type { Container } from "../container/contract"
import ServiceProvider from "../support/service-provider"
import { Bus } from "./bus"

export class EventsProvider extends ServiceProvider {
    register(container: Container) {
        container.singleton("events", (_c) => new Bus())
    }
}
