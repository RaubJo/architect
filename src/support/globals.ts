export function registerGlobalHelpers(helpers: Record<string, unknown>): void {
    const g = globalThis as Record<string, unknown>
    for (const [key, value] of Object.entries(helpers)) {
        if (typeof g[key] === "undefined") g[key] = value
    }
}
