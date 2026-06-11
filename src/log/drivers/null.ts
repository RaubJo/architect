import type { Contract } from "../contract"

export default class NullLogger implements Contract {
    /**
     * {@inheritDoc}
     */
    debug(_message: string, _context?: Record<string, unknown>): void {}

    /**
     * {@inheritDoc}
     */
    info(_message: string, _context?: Record<string, unknown>): void {}

    /**
     * {@inheritDoc}
     */
    warn(_message: string, _context?: Record<string, unknown>): void {}

    /**
     * {@inheritDoc}
     */
    error(_message: string, _context?: Record<string, unknown>): void {}
}
