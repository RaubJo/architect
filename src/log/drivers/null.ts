import type { Contract } from "../contract"

export default class NullLogger implements Contract {
    debug(_message: string, _context?: Record<string, unknown>): void {}
    info(_message: string, _context?: Record<string, unknown>): void {}
    warn(_message: string, _context?: Record<string, unknown>): void {}
    error(_message: string, _context?: Record<string, unknown>): void {}
}
