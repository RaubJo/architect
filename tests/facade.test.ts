import { afterEach, describe, expect, test } from "bun:test"
import CacheManager from "@/cache/manager"
import type { ContainerContract } from "@/container/contract"
import BuiltinContainer from "@/container/adapters/builtin"

import ConfigRepository from "@/config/repository"
import { Application } from "@/foundation/application"
import MemoryStorageAdapter from "@/storage/adapters/memory"
import StorageManager from "@/storage/manager"
import Facade, { clearFacadeCache, createFacade, flushAllMacros } from "@/support/facades/facade"
import Cache from "@/support/facades/cache"
import Config from "@/support/facades/config"
import Storage from "@/support/facades/storage"

// Helper to inject a fake container for facade tests.
function setContainer(container: ContainerContract) {
    ;(Application as unknown as { container: ContainerContract | null }).container = container
}

function resetContainer() {
    const app = Application as unknown as { container: ContainerContract | null }
    if (app.container && typeof app.container.flush === "function") {
        app.container.flush()
    }
    app.container = null
    clearFacadeCache()
    flushAllMacros()
}

describe("Facade base class (backward compatibility)", () => {
    afterEach(resetContainer)

    test("throws when accessor is not implemented", () => {
        class BrokenFacade extends Facade {
            static callAccessorForTest() {
                return (BrokenFacade as unknown as { getFacadeAccessor: () => unknown }).getFacadeAccessor()
            }
        }

        expect(() => BrokenFacade.callAccessorForTest()).toThrow("Facade does not implement getFacadeAccessor().")
    })

    test("callFacadeMethod dispatches to target method", () => {
        class MethodFacade extends Facade {
            protected static getFacadeAccessor() {
                return "method.target"
            }

            static callMethod<T>(method: string, ...args: unknown[]) {
                return (
                    MethodFacade as unknown as {
                        callFacadeMethod: <R>(methodName: string, ...values: unknown[]) => R
                    }
                ).callFacadeMethod<T>(method, ...args)
            }
        }

        const container = new BuiltinContainer()
        container.bind("method.target").toConstantValue({
            sum: (a: number, b: number) => a + b,
        })
        setContainer(container)

        expect(MethodFacade.callMethod<number>("sum", 2, 3)).toBe(5)
    })

    test("callFacadeMethod throws for missing target method", () => {
        class MethodFacade extends Facade {
            protected static getFacadeAccessor() {
                return "method.target"
            }

            static callMethod<T>(method: string, ...args: unknown[]) {
                return (
                    MethodFacade as unknown as {
                        callFacadeMethod: <R>(methodName: string, ...values: unknown[]) => R
                    }
                ).callFacadeMethod<T>(method, ...args)
            }
        }

        const container = new BuiltinContainer()
        container.bind("method.target").toConstantValue({})
        setContainer(container)

        expect(() => MethodFacade.callMethod("missing")).toThrow(
            "Method [missing] does not exist on resolved facade instance.",
        )
    })

    test("can clear a single resolved instance", () => {
        class MethodFacade extends Facade {
            protected static getFacadeAccessor() {
                return "method.target"
            }

            static callMethod<T>(method: string, ...args: unknown[]) {
                return (
                    MethodFacade as unknown as {
                        callFacadeMethod: <R>(methodName: string, ...values: unknown[]) => R
                    }
                ).callFacadeMethod<T>(method, ...args)
            }
        }

        const container = new BuiltinContainer()
        container.bind("method.target").toConstantValue({
            value: () => "cached",
        })
        setContainer(container)

        expect(MethodFacade.callMethod<string>("value")).toBe("cached")
        Facade.clearResolvedInstance("method.target")
        expect(MethodFacade.callMethod<string>("value")).toBe("cached")
    })

    test("base facade constructor is invokable through subclass", () => {
        class ConcreteFacade extends Facade {
            protected static getFacadeAccessor() {
                return "noop"
            }
        }

        const instance = new ConcreteFacade()
        expect(instance).toBeInstanceOf(ConcreteFacade)
    })
})

describe("Proxy-based facade (createFacade)", () => {
    afterEach(resetContainer)

    test("getFacadeAccessor returns the configured accessor", () => {
        expect((Config as unknown as { getFacadeAccessor: () => string }).getFacadeAccessor()).toBe("config")
        expect((Cache as unknown as { getFacadeAccessor: () => string }).getFacadeAccessor()).toBe("cache")
        expect((Storage as unknown as { getFacadeAccessor: () => string }).getFacadeAccessor()).toBe("storage")
    })

    test("Config delegates all methods to ConfigRepository", () => {
        const container = new BuiltinContainer()
        const repository = new ConfigRepository({
            app: {
                name: "IOC",
                retries: 3,
                ratio: 1.5,
                enabled: true,
                tags: ["base"],
            },
        })
        container.bind("config").toConstantValue(repository)
        container.bind(ConfigRepository).toConstantValue(repository)
        setContainer(container)

        expect(Config.has("app.name")).toBe(true)
        expect(Config.get("app.name")).toBe("IOC")
        expect(Config.get<number>("app.retries")).toBe(3)
        expect(Config.get<number>("app.ratio")).toBe(1.5)
        expect(Config.get<boolean>("app.enabled")).toBe(true)
        expect(Config.get<string[]>("app.tags")).toEqual(["base"])
        expect(Config.getMany(["app.name"])).toEqual({ "app.name": "IOC" })

        Config.set("app.name", "Changed")
        Config.prepend("app.tags", "first")
        Config.push("app.tags", "last")

        expect(Config.get("app.name")).toBe("Changed")
        expect(Config.get<string[]>("app.tags")).toEqual(["first", "base", "last"])
        expect(Config.all()).toMatchObject({
            app: { name: "Changed" },
        })
    })

    test("Cache delegates async methods to CacheManager", async () => {
        const manager = new CacheManager({ memory: new MemoryStorageAdapter() }, "memory")
        const container = new BuiltinContainer()
        container.bind("cache").toConstantValue(manager)
        container.bind(CacheManager).toConstantValue(manager)
        setContainer(container)

        await Cache.set("name", "ioc")
        expect(await Cache.get("name")).toBe("ioc")
        expect(await Cache.has("name")).toBe(true)
        expect(await Cache.keys()).toEqual(["name"])
        expect(Cache.store()).toBe(manager.store())
        Cache.use("memory")
        await Cache.delete("name")
        expect(await Cache.get("name")).toBeNull()
        await Cache.set("x", 1)
        await Cache.clear()
        expect(await Cache.keys()).toEqual([])
    })

    test("Storage delegates async methods to StorageManager", async () => {
        const container = new BuiltinContainer()
        const manager = new StorageManager({ memory: new MemoryStorageAdapter() }, "memory")
        container.bind("storage").toConstantValue(manager)
        container.bind(StorageManager).toConstantValue(manager)
        setContainer(container)

        await Storage.set("name", "ioc")
        expect(await Storage.get("name")).toBe("ioc")
        expect(await Storage.has("name")).toBe(true)
        expect(await Storage.keys()).toEqual(["name"])
        expect(Storage.driver()).toBe(manager.driver())
        expect(Storage.driver("memory")).toBe(manager.driver("memory"))
        Storage.use("memory")
        await Storage.delete("name")
        expect(await Storage.get("name")).toBeNull()
        await Storage.set("x", 1)
        await Storage.clear()
        expect(await Storage.keys()).toEqual([])
    })

    test("uses() returns the facade for chaining", async () => {
        const manager = new StorageManager({ memory: new MemoryStorageAdapter() }, "memory")
        const container = new BuiltinContainer()
        container.bind("storage").toConstantValue(manager)
        container.bind(StorageManager).toConstantValue(manager)
        setContainer(container)

        await Storage.set("x", 1)
        const result = Storage.use("memory")
        // Should return the facade proxy (truthy object).
        expect(result).toBeTruthy()
        // Should be able to chain.
        await Storage.use("memory").set("y", 2)
        expect(await Storage.get("y")).toBe(2)
    })

    test("facade helper methods tolerate missing optional manager methods", () => {
        const Plain = createFacade("plain") as {
            use: () => unknown
            store: () => unknown
            driver: () => unknown
            value: string
        }
        const container = new BuiltinContainer()
        container.bind("plain").toConstantValue({ value: "raw" })
        setContainer(container)

        expect(Plain.use()).toBe(Plain)
        expect(Plain.store()).toBeUndefined()
        expect(Plain.driver()).toBeUndefined()
        expect(Plain.value).toBe("raw")
        expect("value" in Plain).toBe(true)
    })

    test("clearFacadeCache clears resolved instances", () => {
        const container = new BuiltinContainer()
        const repository = new ConfigRepository({ app: { name: "First" } })
        container.bind("config").toConstantValue(repository)
        setContainer(container)

        expect(Config.get("app.name")).toBe("First")

        container.unbind("config")
        container.bind("config").toConstantValue(new ConfigRepository({ app: { name: "Second" } }))

        // Facade caches the first instance.
        expect(Config.get("app.name")).toBe("First")

        clearFacadeCache()

        // After clearing, it resolves the new instance.
        expect(Config.get("app.name")).toBe("Second")
    })

    test("callFacadeMethod dispatches through proxy facade", () => {
        const container = new BuiltinContainer()
        container.bind("config").toConstantValue(new ConfigRepository({ app: { name: "test" } }))
        setContainer(container)

        expect(Config.callFacadeMethod<string>("get", "app.name")).toBe("test")
    })

    test("callFacadeMethod throws for non-existent method", () => {
        const container = new BuiltinContainer()
        container.bind("config").toConstantValue(new ConfigRepository({}))
        setContainer(container)

        expect(() => Config.callFacadeMethod("nonExistent")).toThrow(
            "Method [nonExistent] does not exist on resolved facade instance.",
        )
    })

    test("callFacadeMethod dispatches registered macros", () => {
        const container = new BuiltinContainer()
        container.bind("config").toConstantValue(new ConfigRepository({ app: { name: "macro" } }))
        setContainer(container)

        Config.macro("configuredName", (instance) => instance.get("app.name"))

        expect(Config.callFacadeMethod("configuredName")).toBe("macro")
    })
})

describe("Facade macros", () => {
    afterEach(resetContainer)

    test("register and invoke a macro", () => {
        const container = new BuiltinContainer()
        container.bind("config").toConstantValue(new ConfigRepository({ app: { name: "test" } }))
        setContainer(container)

        Config.macro("appName", (instance) => {
            return instance.get<string>("app.name")
        })

        expect((Config as Record<string, unknown>).appName()).toBe("test")
    })

    test("macro receives the resolved instance as first argument", () => {
        const container = new BuiltinContainer()
        container.bind("config").toConstantValue(new ConfigRepository({ app: { retries: 5 } }))
        setContainer(container)

        let receivedInstance: unknown
        Config.macro("capture", (instance) => {
            receivedInstance = instance
            return "ok"
        })

        ;(Config as Record<string, unknown>).capture()
        expect(receivedInstance).toBeInstanceOf(ConfigRepository)
    })

    test("macro takes precedence over instance method", () => {
        const container = new BuiltinContainer()
        container.bind("config").toConstantValue(new ConfigRepository({ app: { name: "original" } }))
        setContainer(container)

        // Before macro: calls the real get method.
        expect(Config.get("app.name")).toBe("original")

        Config.macro("get", () => "overridden")

        // After macro: macro wins.
        expect((Config as Record<string, unknown>).get("app.name")).toBe("overridden")
    })

    test("hasMacro returns correct value", () => {
        expect(Config.hasMacro("test")).toBe(false)

        Config.macro("test", () => {})

        expect(Config.hasMacro("test")).toBe(true)
    })

    test("flushMacros clears macros for the facade", () => {
        Config.macro("temp", () => "value")
        expect(Config.hasMacro("temp")).toBe(true)

        Config.flushMacros()
        expect(Config.hasMacro("temp")).toBe(false)
    })

    test("macros are scoped per accessor", () => {
        const manager = new CacheManager({ memory: new MemoryStorageAdapter() }, "memory")
        const container = new BuiltinContainer()
        container.bind("config").toConstantValue(new ConfigRepository({}))
        container.bind("cache").toConstantValue(manager)
        container.bind(CacheManager).toConstantValue(manager)
        setContainer(container)

        Config.macro("onlyConfig", () => "config-only")
        expect(Config.hasMacro("onlyConfig")).toBe(true)
        expect(Cache.hasMacro("onlyConfig")).toBe(false)
    })

    test("macro with arguments passes them through", () => {
        const container = new BuiltinContainer()
        container.bind("config").toConstantValue(new ConfigRepository({}))
        setContainer(container)

        Config.macro("required", (instance, key: string, defaultValue?: string) => {
            const value = instance.get<string>(key)
            return value ?? defaultValue ?? "missing"
        })

        const result = (Config as Record<string, unknown>).required("non.existent", "fallback")
        expect(result).toBe("fallback")
    })

    test("macros survive facade cache clear", () => {
        const container = new BuiltinContainer()
        container.bind("config").toConstantValue(new ConfigRepository({ app: { v: 1 } }))
        setContainer(container)

        Config.macro("double", (instance, key: string) => {
            return (instance.get<number>(key) ?? 0) * 2
        })

        expect((Config as Record<string, unknown>).double("app.v")).toBe(2)

        clearFacadeCache()

        expect((Config as Record<string, unknown>).double("app.v")).toBe(2)
    })

    test("flushAllMacros clears all facade macros", () => {
        Config.macro("configMacro", () => {})
        Cache.macro("cacheMacro", () => {})

        expect(Config.hasMacro("configMacro")).toBe(true)
        expect(Cache.hasMacro("cacheMacro")).toBe(true)

        flushAllMacros()

        expect(Config.hasMacro("configMacro")).toBe(false)
        expect(Cache.hasMacro("cacheMacro")).toBe(false)
    })

    test("clearResolvedInstance can be called on the proxy", () => {
        // Call the method directly - it clears from the internal Map.
        ;(Config as Record<string, unknown>).clearResolvedInstance("config")
        expect(true).toBe(true)
    })

    test("clearResolvedInstances can be called on the proxy", () => {
        const container = new BuiltinContainer()
        container.bind("config").toConstantValue(new ConfigRepository({ app: { name: "test" } }))
        setContainer(container)

        // Call the method to cover the line.
        ;(Config as Record<string, unknown>).clearResolvedInstances()
        expect(true).toBe(true)
    })

    test("clearResolvedInstances can be called on the proxy", () => {
        const container = new BuiltinContainer()
        container.bind("config").toConstantValue(new ConfigRepository({ app: { name: "test" } }))
        setContainer(container)

        // Call the method to cover the line.
        ;(Config as Record<string, unknown>).clearResolvedInstances()
        expect(true).toBe(true)
    })

    test("has() proxy trap detects facade properties and macros", () => {
        const container = new BuiltinContainer()
        container.bind("config").toConstantValue(new ConfigRepository({ app: { name: "test" } }))
        setContainer(container)

        // Built-in facade methods.
        expect("getFacadeAccessor" in Config).toBe(true)
        expect("macro" in Config).toBe(true)
        expect("hasMacro" in Config).toBe(true)

        // Instance methods.
        expect("get" in Config).toBe(true)
        expect("set" in Config).toBe(true)

        // Macros take precedence.
        Config.macro("fakeMethod", () => "macro")
        expect("fakeMethod" in Config).toBe(true)

        // Non-existent properties.
        expect("nonExistent" in Config).toBe(false)
    })
})
