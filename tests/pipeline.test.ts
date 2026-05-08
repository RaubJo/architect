import { describe, expect, test } from "bun:test";
import * as Pipeline from "@/support/pipeline";

describe("Pipeline", () => {
    test("thenReturn() passes value through pipes in order", () => {
        const result = Pipeline.send(1)
            .through([
                (v, next) => next(v + 1),
                (v, next) => next(v * 2),
            ])
            .thenReturn();

        expect(result).toBe(4); // (1+1)*2
    });

    test("then() calls destination at the end", () => {
        const result = Pipeline.send("hello")
            .through([(v, next) => next(v.toUpperCase())])
            .then((v) => `${v}!`);

        expect(result).toBe("HELLO!");
    });

    test("empty pipes passes value straight to destination", () => {
        const result = Pipeline.send(42).through([]).then((v) => v * 2);
        expect(result).toBe(84);
    });

    test("pipes can short-circuit by not calling next", () => {
        const result = Pipeline.send(1)
            .through([
                (_v, _next) => 99,
                (v, next) => next(v + 1),
            ])
            .thenReturn();

        expect(result).toBe(99);
    });

    test("through replaces pipes", () => {
        const p = Pipeline.send(1).through([(v, next) => next(v + 10)]);
        p.through([(v, next) => next(v + 1)]);
        expect(p.thenReturn()).toBe(2);
    });
});
