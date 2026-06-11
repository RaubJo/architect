import type { Contract } from "../contract"

export default class StackLogger implements Contract {
    constructor(protected drivers: Contract[]) {}

    /**
     * {@inheritDoc}
     */
    debug(message: string, context?: Record<string, unknown>): void {
        this.dispatch("debug", message, context)
    }

    /**
     * {@inheritDoc}
     */
    info(message: string, context?: Record<string, unknown>): void {
        this.dispatch("info", message, context)
    }

    /**
     * {@inheritDoc}
     */
    warn(message: string, context?: Record<string, unknown>): void {
        this.dispatch("warn", message, context)
    }

    /**
     * {@inheritDoc}
     */
    error(message: string, context?: Record<string, unknown>): void {
        this.dispatch("error", message, context)
    }

    /**
     * Forwards the log call to each driver in order, swallowing any individual driver errors.
     */
    protected dispatch(level: keyof Contract, message: string, context?: Record<string, unknown>): void {
        for (const driver of this.drivers) {
            try {
                driver[level](message, context)
            } catch {
                // swallow — a logging failure must not crash the application
            }
        }
    }
}
