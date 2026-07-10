import { describe, expect, test } from "bun:test"
import { subscribe } from "valtio/vanilla"
import BuiltinContainer from "@/container/adapters/builtin"
import ReactiveProvider from "@/reactive/provider"

describe("ReactiveProvider", () => {
    test("register wires the 'reactive' tag to a Valtio proxy transform", () => {
        const container = new BuiltinContainer()
        new ReactiveProvider().register(container)

        class Menu {
            open = false
        }
        container.singleton(Menu, Menu)
        container.tag(Menu, "reactive")

        const menu = container.make<Menu>(Menu)

        const seen: boolean[] = []
        subscribe(menu, () => seen.push(menu.open), true)

        menu.open = true

        expect(seen).toEqual([true])
    })

    test("singleton identity is stable across repeated make() calls", () => {
        const container = new BuiltinContainer()
        new ReactiveProvider().register(container)

        class Menu {
            open = false
        }
        container.singleton(Menu, Menu)
        container.tag(Menu, "reactive")

        expect(container.make(Menu)).toBe(container.make(Menu))
    })

    test("a constant binding is wrapped once and reused", () => {
        const container = new BuiltinContainer()
        new ReactiveProvider().register(container)

        container.instance("state", { count: 0 })
        container.tag("state", "reactive")

        expect(container.make("state")).toBe(container.make("state"))
    })

    test("without the provider, 'reactive' is an inert tag", () => {
        const container = new BuiltinContainer()

        class Menu {
            open = false
        }
        container.singleton(Menu, Menu)
        container.tag(Menu, "reactive")

        const menu = container.make<Menu>(Menu)
        expect(() => subscribe(menu, () => {})).toThrow()
    })
})
