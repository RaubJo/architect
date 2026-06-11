export interface Contract {
    /**
     * Log a debug-level message for detailed diagnostic information.
     */
    debug(message: string, context?: Record<string, unknown>): void

    /**
     * Log an informational message about normal application flow.
     */
    info(message: string, context?: Record<string, unknown>): void

    /**
     * Log a warning about a recoverable or unexpected condition.
     */
    warn(message: string, context?: Record<string, unknown>): void

    /**
     * Log an error indicating a failure that requires attention.
     */
    error(message: string, context?: Record<string, unknown>): void
}
