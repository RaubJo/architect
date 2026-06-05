export function registerGlobalHelpers(helpers: Record<string, unknown>): void {
    const globalScope = globalThis as Record<string, unknown>
    for (const [key, value] of Object.entries(helpers)) {
        if (typeof globalScope[key] === "undefined") {
            globalScope[key] = value
        }
    }
}
