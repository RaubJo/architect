import type { Container } from "../container/contract"
import { Bus } from "../events/bus"
import ServiceProvider, { type Cleanup } from "../support/service-provider"
import ArchitectError from "./error"

export class ErrorsProvider extends ServiceProvider {
    register(container: Container) {
        if (!container.bound("events")) {
            container.singleton("events", () => new Bus())
        }
    }

    boot(container: Container): Cleanup | void {
        if (typeof window === "undefined") {
            return
        }

        const bus = container.make<Bus>("events")
        const controller = new AbortController()
        const { signal } = controller

        window.addEventListener(
            "error",
            (event) => {
                // Same-origin filename filter — drops extension/third-party-script noise and
                // censored cross-origin "Script error." events. Assumes app bundles are served
                // from the page's own origin.
                if (!event.filename?.startsWith(window.location.origin)) {
                    return
                }

                void bus.dispatch(new ArchitectError(event.error ?? event.message, "window"))
            },
            { signal },
        )

        window.addEventListener(
            "unhandledrejection",
            (event) => {
                void bus.dispatch(new ArchitectError(event.reason, "promise"))
            },
            { signal },
        )

        return () => controller.abort()
    }
}
