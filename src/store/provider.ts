import type ConfigRepository from "../config/repository"
import type { ServiceProviderContext } from "../support/service-provider"
import ServiceProvider from "../support/service-provider"
import StoreManager from "./manager"

export class StoreProvider extends ServiceProvider {
    register({ container }: ServiceProviderContext) {
        container.singleton("store", (c) => StoreManager.fromConfig(c.make<ConfigRepository>("config")))
    }
}
