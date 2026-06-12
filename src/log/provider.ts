import type ConfigRepository from "../config/repository"
import type { Container } from "../container/contract"
import ServiceProvider from "../support/service-provider"
import LogManager from "./manager"

export class LogProvider extends ServiceProvider {
    register(container: Container): void {
        container.singleton("log", (c) => LogManager.fromConfig(c.make<ConfigRepository>("config")))
        container.singleton(LogManager, (c) => c.make<LogManager>("log"))
    }
}
