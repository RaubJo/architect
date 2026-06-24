import { describe, expect, test } from "bun:test"
import ConfigRepository from "@/config/repository"

describe("ConfigRepository", () => {
    test("gets nested values by dot key", () => {
        const repository = new ConfigRepository({
            app: {
                name: "IOC Application",
                timezone: "UTC",
            },
        })

        expect(repository.get("app.name")).toBe("IOC Application")
        expect(repository.get("app.timezone")).toBe("UTC")
    })

    test("supports defaults and lazy default callbacks", () => {
        const repository = new ConfigRepository({})

        expect(repository.get("app.locale", "en")).toBe("en")
        expect(repository.get("app.name", () => "fallback")).toBe("fallback")
    })

    test("supports set, prepend, and push", () => {
        const repository = new ConfigRepository({
            app: {
                middlewares: ["auth"],
            },
        })

        repository.prepend("app.middlewares", "throttle")
        repository.push("app.middlewares", "verified")
        repository.set("app.name", "IOC")

        expect(repository.get("app.name")).toBe("IOC")
        expect(repository.get<string[]>("app.middlewares")).toEqual(["throttle", "auth", "verified"])
    })

    test("supports getMany with list and defaults map", () => {
        const repository = new ConfigRepository({
            app: { name: "IOC Application" },
        })

        expect(repository.getMany(["app.name", "app.locale"])).toEqual({
            "app.name": "IOC Application",
            "app.locale": null,
        })

        expect(
            repository.getMany({
                "app.name": "fallback",
                "app.locale": "en",
            }),
        ).toEqual({
            "app.name": "IOC Application",
            "app.locale": "en",
        })
    })
})
