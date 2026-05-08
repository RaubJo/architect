import { describe, expect, test } from "bun:test";
import Manager from "@/support/manager";
import ConfigRepository from "@/config/repository";

class ConcreteManager extends Manager<string> {
    protected createDriver(raw: string): string {
        return raw.toUpperCase();
    }
}

class DefaultDriverTypeManager extends Manager<string> {
    protected createDriver(raw: string): string {
        return raw;
    }
    // Does NOT override driverType() — tests the base "Driver" default
}

describe("Manager base class", () => {
    test("resolves the active driver directly from drivers map", () => {
        const m = new ConcreteManager({ memory: "mem", disk: "dsk" }, "memory");
        expect(m["resolve"]("memory")).toBe("mem");
    });

    test("use() switches the active driver", () => {
        const m = new ConcreteManager({ memory: "mem", disk: "dsk" }, "memory");
        m.use("disk");
        expect(m["active"]).toBe("disk");
    });

    test("resolve() throws with base driverType() label when not overriding", () => {
        const m = new DefaultDriverTypeManager({ one: "a" }, "one");
        expect(() => m["resolve"]("missing")).toThrow("Driver [missing] is not defined.");
    });

    test("extend() lazily registers a custom driver via factory", () => {
        const m = new ConcreteManager({ base: "b" }, "base");
        let created = 0;

        m.extend("custom", () => {
            created++;
            return "custom-value";
        });

        expect(created).toBe(0);
        m.use("custom");
        expect(m["active"]).toBe("custom");
        expect(created).toBe(1);

        // Cached on second use
        m.use("custom");
        expect(created).toBe(1);
    });

    test("defaultDriverName() falls back to first key when no 'default' key exists", () => {
        // active = "default" (not in drivers) → calls defaultDriverName()
        const m = new DefaultDriverTypeManager({ first: "a", second: "b" });
        expect(m["active"]).toBe("first");
    });

    test("defaultDriverName() returns 'default' string when drivers is empty", () => {
        const m = new DefaultDriverTypeManager({});
        // Object.keys({}) is [], so Object.keys({})[0] is undefined → ?? "default"
        expect(m["active"]).toBe("default");
    });

    test("constructor uses config when provided", () => {
        const config = new ConfigRepository({ driver: "memory" });
        const m = new ConcreteManager({ memory: "mem" }, "memory", config);
        expect(m["config"]).toBe(config);
    });
});
