import type { Contract } from "../contract"

const LEVELS = ["debug", "info", "warn", "error"] as const
type Level = (typeof LEVELS)[number]

export default class ConsoleLogger implements Contract {
    protected threshold: number

    constructor(level: Level = "debug") {
        this.threshold = LEVELS.indexOf(level)
    }

    debug(message: string, context?: Record<string, unknown>): void {
        if (this.passes(0)) console.debug(message, ...this.spread(context))
    }

    info(message: string, context?: Record<string, unknown>): void {
        if (this.passes(1)) console.info(message, ...this.spread(context))
    }

    warn(message: string, context?: Record<string, unknown>): void {
        if (this.passes(2)) console.warn(message, ...this.spread(context))
    }

    error(message: string, context?: Record<string, unknown>): void {
        if (this.passes(3)) console.error(message, ...this.spread(context))
    }

    /**
     * Returns true if the given numeric level meets or exceeds the configured threshold.
     */
    protected passes(level: number): boolean {
        return level >= this.threshold
    }

    /**
     * Returns the context as a single-element array, or an empty array when absent.
     */
    protected spread(context?: Record<string, unknown>): unknown[] {
        return context !== undefined ? [context] : []
    }
}
