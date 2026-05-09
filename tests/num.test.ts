import { describe, expect, test } from "bun:test"
import * as Num from "@/support/num"

describe("Num", () => {
    test("format()", () => {
        expect(Num.format(1234567)).toBe("1,234,567")
        expect(Num.format(Math.PI, 2)).toBe("3.14")
    })

    test("percentage()", () => {
        expect(Num.percentage(75)).toBe("75%")
        expect(Num.percentage(33.333, 1)).toBe("33.3%")
    })

    test("currency()", () => {
        expect(Num.currency(9.99, "USD", "en-US")).toBe("$9.99")
    })

    test("fileSize()", () => {
        expect(Num.fileSize(0)).toBe("0 B")
        expect(Num.fileSize(1024)).toBe("1 KB")
        expect(Num.fileSize(1024 * 1024)).toBe("1 MB")
        expect(Num.fileSize(1536, 1)).toBe("1.5 KB")
    })

    test("abbreviate()", () => {
        expect(Num.abbreviate(500)).toBe("500")
        expect(Num.abbreviate(1_500)).toBe("2K")
        expect(Num.abbreviate(1_500_000)).toBe("2M")
        expect(Num.abbreviate(1_500_000_000)).toBe("2B")
        expect(Num.abbreviate(1_500, 1)).toBe("1.5K")
    })

    test("clamp()", () => {
        expect(Num.clamp(5, 1, 10)).toBe(5)
        expect(Num.clamp(0, 1, 10)).toBe(1)
        expect(Num.clamp(15, 1, 10)).toBe(10)
    })

    test("between()", () => {
        expect(Num.between(5, 1, 10)).toBe(true)
        expect(Num.between(1, 1, 10)).toBe(true)
        expect(Num.between(10, 1, 10)).toBe(true)
        expect(Num.between(0, 1, 10)).toBe(false)
        expect(Num.between(11, 1, 10)).toBe(false)
    })
})
