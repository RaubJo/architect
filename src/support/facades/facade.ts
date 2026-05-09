import { makeFromCurrentApplication } from "../../foundation/current-application"

// Module-level state shared by all facades.
const macroRegistry = new Map<string, Map<string, (...args: unknown[]) => unknown>>()
const resolvedInstances = new Map<string, unknown>()

export function clearFacadeCache(): void {
    resolvedInstances.clear()
}

export function flushAllMacros(): void {
    macroRegistry.clear()
}

function getMacros(accessor: string): Map<string, (...args: unknown[]) => unknown> {
    let macros = macroRegistry.get(accessor)
    if (!macros) {
        macros = new Map()
        macroRegistry.set(accessor, macros)
    }
    return macros
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FacadeInstance<T = unknown> {
    getFacadeAccessor(): string
    macro(name: string, fn: (instance: T, ...args: unknown[]) => unknown): void
    hasMacro(name: string): boolean
    flushMacros(): void
    clearResolvedInstance(name: string): void
    clearResolvedInstances(): void
    callFacadeMethod(method: string, ...args: unknown[]): unknown
    callFacadeMethod<R = unknown>(method: string, ...args: unknown[]): R
    use(...args: unknown[]): unknown
    store(...args: unknown[]): unknown
    driver(...args: unknown[]): unknown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createFacade<T = any>(
    accessor: string,
): FacadeInstance<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let proxy: any

    const facade: Record<string, unknown> = {
        getFacadeAccessor(): string {
            return accessor
        },

        macro(name: string, fn: (instance: T, ...args: unknown[]) => unknown): void {
            getMacros(accessor).set(name, fn as (...args: unknown[]) => unknown)
        },

        hasMacro(name: string): boolean {
            return getMacros(accessor).has(name)
        },

        flushMacros(): void {
            getMacros(accessor).clear()
        },

        clearResolvedInstance(name: string): void {
            resolvedInstances.delete(name)
        },

        clearResolvedInstances(): void {
            resolvedInstances.clear()
        },

        callFacadeMethod<R = unknown>(method: string, ...args: unknown[]): R {
            const macro = getMacros(accessor).get(method)
            if (macro) {
                const instance = resolveInstance<T>(accessor)
                return macro(instance, ...args) as R
            }

            const instance = resolveInstance<Record<string, (...a: unknown[]) => unknown>>(accessor)
            const callable = instance[method]
            if (typeof callable !== "function") {
                throw new Error(`Method [${method}] does not exist on resolved facade instance.`)
            }

            return callable.apply(instance, args) as R
        },

        // use() and store()/driver() return the manager for chaining.
        // We return the proxy instead so the chain continues on the facade.
        use(...args: unknown[]): unknown {
            const instance = resolveInstance<Record<string, (...a: unknown[]) => unknown>>(accessor)
            if (typeof instance.use === "function") {
                instance.use(...args)
            }
            return proxy
        },

        store(...args: unknown[]): unknown {
            const instance = resolveInstance<Record<string, (...a: unknown[]) => unknown>>(accessor)
            if (typeof instance.store === "function") {
                return instance.store(...args)
            }
            return undefined
        },

        driver(...args: unknown[]): unknown {
            const instance = resolveInstance<Record<string, (...a: unknown[]) => unknown>>(accessor)
            if (typeof instance.driver === "function") {
                return instance.driver(...args)
            }
            return undefined
        },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    proxy = new Proxy(facade, {
        get(target, prop) {
            if (prop in target) {
                return target[prop as string]
            }

            const name = String(prop)

            // Macro check (takes precedence over instance methods).
            const macros = getMacros(accessor)
            const macro = macros.get(name)
            if (macro) {
                return (...args: unknown[]) => {
                    const instance = resolveInstance<T>(accessor)
                    return macro(instance, ...args)
                }
            }

            const instance = resolveInstance<Record<string, unknown>>(accessor)
            const value = instance[prop as keyof typeof instance]

            if (typeof value === "function") {
                return (...args: unknown[]) => {
                    return (value as (...a: unknown[]) => unknown).apply(instance, args)
                }
            }

            return value
        },

        has(target, prop) {
            if (prop in target) return true
            const name = String(prop)
            if (getMacros(accessor).has(name)) return true
            const instance = resolveInstance<Record<string, unknown>>(accessor)
            return name in instance
        },
    })

    return proxy as FacadeInstance<T>
}

function resolveInstance<T>(accessor: string): T {
    if (resolvedInstances.has(accessor)) {
        return resolvedInstances.get(accessor) as T
    }

    const instance = makeFromCurrentApplication<T>(accessor)
    resolvedInstances.set(accessor, instance)
    return instance
}

// Backward-compatible Facade class.
// New code should prefer `createFacade()`. This class exists so existing
// subclassing patterns and `Facade.clearResolvedInstances()` still work.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default abstract class Facade {
    protected static resolvedInstance = resolvedInstances

    protected static getFacadeAccessor(): string {
        throw new Error("Facade does not implement getFacadeAccessor().")
    }

    static clearResolvedInstance(name: string): void {
        resolvedInstances.delete(name)
    }

    static clearResolvedInstances(): void {
        resolvedInstances.clear()
    }

    protected static resolveFacadeInstance<T>(): T {
        // biome-ignore lint/complexity/noThisInStatic: requries this for polymorphism
        const accessor = this.getFacadeAccessor()

        if (resolvedInstances.has(accessor)) {
            return resolvedInstances.get(accessor) as T
        }

        const instance = makeFromCurrentApplication<T>(accessor)
        resolvedInstances.set(accessor, instance)
        return instance
    }

    protected static callFacadeMethod<T = unknown>(method: string, ...args: unknown[]): T {
        // biome-ignore lint/complexity/noThisInStatic: this is required for polymorphism
        const instance = this.resolveFacadeInstance<Record<string, (...a: unknown[]) => unknown>>()
        const callable = instance[method]
        if (typeof callable !== "function") {
            throw new Error(`Method [${method}] does not exist on resolved facade instance.`)
        }

        return callable.apply(instance, args) as T
    }
}
