import type { Container } from "../container/contract"
import ServiceProvider from "../support/service-provider"
import { Scheduler } from "./scheduler"

export class SchedulerProvider extends ServiceProvider {
    register(container: Container): void {
        container.singleton("scheduler", () => new Scheduler())
        container.singleton(Scheduler, (c) => c.make<Scheduler>("scheduler"))
    }

    boot(container: Container) {
        const scheduler = container.make<Scheduler>("scheduler")
        const handle = setInterval(() => scheduler.run(), 1_000)
        return () => clearInterval(handle)
    }
}
