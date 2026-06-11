import type { ServiceProviderContext } from "../support/service-provider"
import ServiceProvider from "../support/service-provider"
import ConfigRepository from "./repository"

export class ConfigProvider extends ServiceProvider {
    protected readonly repository: ConfigRepository

    constructor(repository: ConfigRepository) {
        super()
        this.repository = repository
    }

    register({ container }: ServiceProviderContext) {
        container.instance("config", this.repository)
        container.instance(ConfigRepository, this.repository)
    }
}
