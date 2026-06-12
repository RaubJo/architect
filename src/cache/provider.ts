import type ConfigRepository from "../config/repository"
import type { Container } from "../container/contract"
import ServiceProvider from "../support/service-provider"
import CacheManager from "./manager"

export class CacheProvider extends ServiceProvider {
    register(container: Container) {
        container.singleton("cache", (c) => CacheManager.fromConfig(c.make<ConfigRepository>("config")))
        container.singleton(CacheManager, (c) => c.make<CacheManager>("cache"))
    }
}
