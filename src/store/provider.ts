import type ConfigRepository from "../config/repository"
import type { Container } from "../container/contract"
import ServiceProvider from "../support/service-provider"
import StoreManager from "./manager"

export class StoreProvider extends ServiceProvider {
    register(container: Container) {
        container.singleton("store", (c) => StoreManager.fromConfig(c.make<ConfigRepository>("config")))
    }
}
