import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const BOOK_DIR = join(import.meta.dir, "../docs/book/src")

// Matches a trailing // comment whose value is a JSON literal (string, number, boolean, null, array, object)
const ASSERTION_RE = /^(\s*)(.+?)\s+\/\/ ((?:"[^"]*"|'[^']*'|-?\d+(?:\.\d+)?|true|false|null|\[.*?\]|\{.*?\}))$/gm

function extractDoctestBlocks(markdown: string): { code: string; index: number }[] {
    const blocks: { code: string; index: number }[] = []
    const re = /```(?:typescript|ts) doctest\n([\s\S]*?)```/g
    let match: RegExpExecArray | null
    let index = 0
    while ((match = re.exec(markdown)) !== null) {
        blocks.push({ code: match[1], index: ++index })
    }
    return blocks
}

function transformAssertions(code: string): string {
    let hasAssertions = false
    const transformed = code.replace(ASSERTION_RE, (original, indent, expr, expected) => {
        if (expected.includes("...")) return original
        hasAssertions = true
        return `${indent}assert.deepStrictEqual(${expr}, ${expected})`
    })
    return hasAssertions ? `import assert from "node:assert/strict"\n${transformed}` : transformed
}

const files = readdirSync(BOOK_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ name: f, content: readFileSync(join(BOOK_DIR, f), "utf-8") }))
    .filter(({ content }) => content.includes("```typescript doctest") || content.includes("```ts doctest"))

for (const { name, content } of files) {
    const blocks = extractDoctestBlocks(content)
    if (blocks.length === 0) continue

    describe(`docs/${name}`, () => {
        for (const { code, index } of blocks) {
            test(`block ${index}`, async () => {
                const source = transformAssertions(code)
                const tmp = join(tmpdir(), `doctest-${Date.now()}-${index}.ts`)
                await Bun.write(tmp, source)

                const result = Bun.spawnSync(["bun", "run", tmp], {
                    cwd: join(import.meta.dir, ".."),
                    stderr: "pipe",
                })

                expect(result.exitCode, new TextDecoder().decode(result.stderr)).toBe(0)
            })
        }
    })
}
