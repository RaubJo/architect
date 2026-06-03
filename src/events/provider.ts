import type { ServiceProviderContext } from "../support/service-provider"
import ServiceProvider from "../support/service-provider"
import { Bus } from "./bus"

export class EventsProvider extends ServiceProvider {
    register({ container }: ServiceProviderContext) {
        container.singleton("events", (_c) => new Bus())
    }
}
