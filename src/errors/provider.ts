import type { Container } from "../container/contract"
import { Bus } from "../events/bus"
import ServiceProvider from "../support/service-provider"
import ArchitectError from "./error"

export class ErrorsProvider extends ServiceProvider {
    protected controller?: AbortController

    register(container: Container) {
        if (!container.bound("events")) {
            container.singleton("events", () => new Bus())
        }
    }

    boot(container: Container): void {
        if (typeof window === "undefined") {
            return
        }

        const bus = container.make<Bus>("events")
        this.controller = new AbortController()
        const { signal } = this.controller

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
    }

    destroy(): void {
        this.controller?.abort()
    }
}
