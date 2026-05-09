function splitWords(value: string): string[] {
    const normalized = value
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_\-.]+/g, " ")
        .trim()
    if (!normalized) return []
    return normalized.split(/\s+/)
}

function normalizeForSlug(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

export function lower(value: string): string {
    return value.toLowerCase()
}

export function upper(value: string): string {
    return value.toUpperCase()
}

export function length(value: string): number {
    return value.length
}

export function contains(haystack: string, needle: string | string[], ignoreCase = false): boolean {
    const source = ignoreCase ? haystack.toLowerCase() : haystack
    const needles = Array.isArray(needle) ? needle : [needle]
    return needles.some((part) => source.includes(ignoreCase ? part.toLowerCase() : part))
}

export function startsWith(haystack: string, needle: string | string[]): boolean {
    const needles = Array.isArray(needle) ? needle : [needle]
    return needles.some((part) => haystack.startsWith(part))
}

export function endsWith(haystack: string, needle: string | string[]): boolean {
    const needles = Array.isArray(needle) ? needle : [needle]
    return needles.some((part) => haystack.endsWith(part))
}

export function replace(search: string | RegExp, replaceWith: string, subject: string): string {
    return subject.replace(search, replaceWith)
}

export function snake(value: string, separator = "_"): string {
    return splitWords(value)
        .map((w) => w.toLowerCase())
        .join(separator)
}

export function kebab(value: string): string {
    return snake(value, "-")
}

export function studly(value: string): string {
    return splitWords(value)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("")
}

export function camel(value: string): string {
    const s = studly(value)
    return s ? s.charAt(0).toLowerCase() + s.slice(1) : ""
}

export function slug(value: string, separator = "-"): string {
    const slugged = normalizeForSlug(value)
    return separator === "-" ? slugged : slugged.replace(/-/g, separator)
}

export function after(subject: string, search: string): string {
    if (search === "") return subject
    const idx = subject.indexOf(search)
    return idx === -1 ? subject : subject.slice(idx + search.length)
}

export function afterLast(subject: string, search: string): string {
    if (search === "") return subject
    const idx = subject.lastIndexOf(search)
    return idx === -1 ? subject : subject.slice(idx + search.length)
}

const APA_MINOR = new Set([
    "a",
    "an",
    "the",
    "and",
    "but",
    "for",
    "nor",
    "or",
    "so",
    "yet",
    "at",
    "by",
    "in",
    "of",
    "on",
    "to",
    "up",
    "as",
    "is",
    "it",
])

export function apa(value: string): string {
    const words = value.split(/\s+/)
    return words
        .map((word, i) => {
            const lower = word.toLowerCase()
            if (i === 0 || i === words.length - 1 || !APA_MINOR.has(lower)) {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            }
            return lower
        })
        .join(" ")
}

export function before(subject: string, search: string): string {
    if (search === "") return subject
    const idx = subject.indexOf(search)
    return idx === -1 ? subject : subject.slice(0, idx)
}

export function beforeLast(subject: string, search: string): string {
    if (search === "") return subject
    const idx = subject.lastIndexOf(search)
    return idx === -1 ? subject : subject.slice(0, idx)
}

export function between(subject: string, from: string, to: string): string {
    if (from === "" || to === "") return subject
    const start = subject.indexOf(from)
    if (start === -1) return subject
    const end = subject.lastIndexOf(to)
    if (end === -1 || end <= start) return subject
    return subject.slice(start + from.length, end)
}

export function betweenFirst(subject: string, from: string, to: string): string {
    if (from === "" || to === "") return subject
    const start = subject.indexOf(from)
    if (start === -1) return subject
    const end = subject.indexOf(to, start + from.length)
    if (end === -1) return subject
    return subject.slice(start + from.length, end)
}

export function charAt(value: string, index: number): string | false {
    if (index < 0 || index >= value.length) return false
    return value[index] as string
}

export function chopStart(value: string, needle: string | string[]): string {
    const needles = Array.isArray(needle) ? needle : [needle]
    for (const n of needles) {
        if (value.startsWith(n)) {
            return value.slice(n.length)
        }
    }
    return value
}

export function chopEnd(value: string, needle: string | string[]): string {
    const needles = Array.isArray(needle) ? needle : [needle]
    for (const n of needles) {
        if (value.endsWith(n)) {
            return value.slice(0, value.length - n.length)
        }
    }
    return value
}

export function containsAll(haystack: string, needles: string[], ignoreCase = false): boolean {
    const source = ignoreCase ? haystack.toLowerCase() : haystack
    return needles.every((n) => source.includes(ignoreCase ? n.toLowerCase() : n))
}

export function deduplicate(value: string, char = " "): string {
    const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return value.replace(new RegExp(`${escaped}+`, "g"), char)
}

export function doesntContain(haystack: string, needle: string | string[], ignoreCase = false): boolean {
    return !contains(haystack, needle, ignoreCase)
}

export function doesntEndWith(haystack: string, needle: string | string[]): boolean {
    return !endsWith(haystack, needle)
}

export function doesntStartWith(haystack: string, needle: string | string[]): boolean {
    return !startsWith(haystack, needle)
}

export function excerpt(value: string, phrase: string, options: { radius?: number; omission?: string } = {}): string {
    const radius = options.radius ?? 100
    const omission = options.omission ?? "..."

    const idx = value.indexOf(phrase)
    if (idx === -1) return value

    const start = Math.max(0, idx - radius)
    const end = Math.min(value.length, idx + phrase.length + radius)

    const prefix = start > 0 ? omission : ""
    const suffix = end < value.length ? omission : ""

    return prefix + value.slice(start, end) + suffix
}

export function finish(value: string, cap: string): string {
    return value.endsWith(cap) ? value : value + cap
}

export function fromBase64(value: string): string {
    return atob(value)
}

export function headline(value: string): string {
    return splitWords(value)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
}

export function initials(value: string, capitalize = false): string {
    const result = value
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0))
        .join("")
    return capitalize ? result.toUpperCase() : result.toLowerCase()
}

export function is(pattern: string, value: string, ignoreCase = false): boolean {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")
    const flags = ignoreCase ? "i" : ""
    return new RegExp(`^${escaped}$`, flags).test(value)
}

export function isAscii(value: string): boolean {
    // biome-ignore lint/suspicious/noControlCharactersInRegex: ascii characters
    return /^[\x00-\x7F]*$/.test(value)
}

export function isJson(value: string): boolean {
    try {
        JSON.parse(value)
        return true
    } catch {
        return false
    }
}

export function isUrl(value: string, protocols?: string[]): boolean {
    try {
        const url = new URL(value)
        if (protocols && protocols.length > 0) {
            const proto = url.protocol.replace(/:$/, "")
            return protocols.includes(proto)
        }
        return true
    } catch {
        return false
    }
}

export function isUlid(value: string): boolean {
    return /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(value)
}

export function isUuid(value: string, version?: 1 | 3 | 4 | 5 | 6 | 7 | 8): boolean {
    if (version === undefined) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    }
    const v = version.toString()
    return new RegExp(`^[0-9a-f]{8}-[0-9a-f]{4}-${v}[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$`, "i").test(value)
}

export function isMatch(pattern: string | RegExp, value: string): boolean {
    return parsePattern(pattern).test(value)
}

export function lcfirst(value: string): string {
    return value ? value.charAt(0).toLowerCase() + value.slice(1) : value
}

export function limit(value: string, limitChars = 100, end = "...", preserveWords = false): string {
    if (value.length <= limitChars) return value
    if (!preserveWords) return value.slice(0, limitChars) + end
    const truncated = value.slice(0, limitChars)
    const lastSpace = truncated.lastIndexOf(" ")
    return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + end
}

export function mask(value: string, char: string, index: number, maskLength?: number): string {
    const len = value.length
    const start = index < 0 ? Math.max(0, len + index) : Math.min(index, len)
    const count = maskLength !== undefined ? Math.min(maskLength, len - start) : len - start
    return value.slice(0, start) + char.repeat(count) + value.slice(start + count)
}

function parsePattern(pattern: string | RegExp): RegExp {
    if (pattern instanceof RegExp) return pattern
    // Support /pattern/flags delimiter syntax
    const delimited = /^\/(.+)\/([gimsuy]*)$/.exec(pattern)
    if (delimited) {
        return new RegExp(delimited[1] as string, delimited[2] || "")
    }
    return new RegExp(pattern)
}

export function match(pattern: string | RegExp, value: string): string {
    const re = parsePattern(pattern)
    const m = value.match(re)
    if (!m) return ""
    return m[1] !== undefined ? m[1] : m[0]
}

export function matchAll(pattern: string | RegExp, value: string): string[] {
    const base = parsePattern(pattern)
    const flags = base.flags.includes("g") ? base.flags : `${base.flags}g`
    const re = new RegExp(base.source, flags)
    const results: string[] = []
    let m: RegExpExecArray | null
    while ((m = re.exec(value)) !== null) {
        results.push(m[1] !== undefined ? m[1] : m[0])
    }
    return results
}

export function padBoth(value: string, padLength: number, pad = " "): string {
    if (value.length >= padLength) return value
    const total = padLength - value.length
    const leftPad = Math.floor(total / 2)
    const rightPad = total - leftPad
    return (
        pad.repeat(Math.ceil(leftPad / pad.length)).slice(0, leftPad) +
        value +
        pad.repeat(Math.ceil(rightPad / pad.length)).slice(0, rightPad)
    )
}

export function padLeft(value: string, padLength: number, pad = " "): string {
    return value.padStart(padLength, pad)
}

export function padRight(value: string, padLength: number, pad = " "): string {
    return value.padEnd(padLength, pad)
}

export function position(haystack: string, needle: string, offset = 0): number | false {
    const idx = haystack.indexOf(needle, offset)
    return idx === -1 ? false : idx
}

export function random(len = 16): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    const result: string[] = []
    if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.getRandomValues === "function") {
        const bytes = new Uint8Array(len)
        globalThis.crypto.getRandomValues(bytes)
        for (const b of bytes) {
            result.push(chars[b % chars.length] as string)
        }
    } else {
        for (let i = 0; i < len; i++) {
            result.push(chars[Math.floor(Math.random() * chars.length)] as string)
        }
    }
    return result.join("")
}

export function remove(search: string | string[], subject: string, caseSensitive = true): string {
    const searches = Array.isArray(search) ? search : [search]
    let result = subject
    for (const s of searches) {
        if (caseSensitive) {
            result = result.split(s).join("")
        } else {
            result = result.replace(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "")
        }
    }
    return result
}

export function repeat(value: string, times: number): string {
    return value.repeat(times)
}

export function replaceArray(search: string, replaceList: string[], subject: string): string {
    let replaceIdx = 0
    const searchLen = search.length
    let result = ""
    let remaining = subject
    while (replaceIdx < replaceList.length) {
        const pos = remaining.indexOf(search)
        if (pos === -1) break
        result += remaining.slice(0, pos) + (replaceList[replaceIdx] as string)
        remaining = remaining.slice(pos + searchLen)
        replaceIdx++
    }
    return result + remaining
}

export function replaceFirst(search: string, replaceWith: string, subject: string): string {
    const idx = subject.indexOf(search)
    if (idx === -1) return subject
    return subject.slice(0, idx) + replaceWith + subject.slice(idx + search.length)
}

export function replaceLast(search: string, replaceWith: string, subject: string): string {
    const idx = subject.lastIndexOf(search)
    if (idx === -1) return subject
    return subject.slice(0, idx) + replaceWith + subject.slice(idx + search.length)
}

export function replaceMatches(
    pattern: string | RegExp,
    replaceWith: string | ((match: string[]) => string),
    subject: string,
): string {
    const base = parsePattern(pattern)
    const flags = base.flags.includes("g") ? base.flags : `${base.flags}g`
    const re = new RegExp(base.source, flags)
    if (typeof replaceWith === "string") {
        return subject.replace(re, replaceWith)
    }
    return subject.replace(re, (...args: unknown[]) => {
        const matchArr = args.slice(0, args.length - 2) as string[]
        return replaceWith(matchArr)
    })
}

export function replaceStart(search: string, replaceWith: string, subject: string): string {
    return subject.startsWith(search) ? replaceWith + subject.slice(search.length) : subject
}

export function replaceEnd(search: string, replaceWith: string, subject: string): string {
    return subject.endsWith(search) ? subject.slice(0, subject.length - search.length) + replaceWith : subject
}

export function reverse(value: string): string {
    return [...value].reverse().join("")
}

export function squish(value: string): string {
    return value.trim().replace(/\s+/g, " ")
}

export function start(value: string, prefix: string): string {
    return value.startsWith(prefix) ? value : prefix + value
}

export function substr(value: string, startIndex: number, len?: number): string {
    if (len === undefined) {
        return value.slice(startIndex)
    }
    return value.slice(startIndex, startIndex < 0 ? startIndex + len : startIndex + len)
}

export function substrCount(value: string, needle: string): number {
    if (needle === "") return 0
    let count = 0
    let idx = 0
    while ((idx = value.indexOf(needle, idx)) !== -1) {
        count++
        idx += needle.length
    }
    return count
}

export function substrReplace(value: string, replacer: string, startIndex: number, len?: number): string {
    const arr = [...value]
    const realStart = startIndex < 0 ? Math.max(0, arr.length + startIndex) : startIndex
    if (len === undefined) {
        arr.splice(realStart, arr.length - realStart, ...replacer)
    } else {
        arr.splice(realStart, len, ...replacer)
    }
    return arr.join("")
}

export function swap(map: Record<string, string>, subject: string): string {
    const keys = Object.keys(map).sort((a, b) => b.length - a.length)
    let result = subject
    for (const key of keys) {
        result = result.split(key).join(map[key] as string)
    }
    return result
}

export function take(value: string, limitChars: number): string {
    if (limitChars >= 0) return value.slice(0, limitChars)
    return value.slice(limitChars)
}

export function title(value: string): string {
    return value.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

export function toBase64(value: string): string {
    return btoa(value)
}

export function trim(value: string, chars?: string): string {
    if (!chars) return value.trim()
    const escaped = chars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return value.replace(new RegExp(`^[${escaped}]+|[${escaped}]+$`, "g"), "")
}

export function ltrim(value: string, chars?: string): string {
    if (!chars) return value.trimStart()
    const escaped = chars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return value.replace(new RegExp(`^[${escaped}]+`, "g"), "")
}

export function rtrim(value: string, chars?: string): string {
    if (!chars) return value.trimEnd()
    const escaped = chars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return value.replace(new RegExp(`[${escaped}]+$`, "g"), "")
}

export function ucfirst(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

export function ucsplit(value: string): string[] {
    return value.split(/(?=[A-Z])/).filter(Boolean)
}

export function ucwords(value: string): string {
    return value.replace(/(?:^|\s)\S/g, (c) => c.toUpperCase())
}

export function unwrap(value: string, before: string, after?: string): string {
    const end = after ?? before
    let result = value
    if (result.startsWith(before)) result = result.slice(before.length)
    if (result.endsWith(end)) result = result.slice(0, result.length - end.length)
    return result
}

export function wordCount(value: string): number {
    return value.trim() === "" ? 0 : value.trim().split(/\s+/).length
}

export function wordWrap(value: string, characters = 75, breakWith = "\n", cutLongWords = false): string {
    if (value.length <= characters) return value
    const words = value.split(" ")
    const lines: string[] = []
    let current = ""
    for (const word of words) {
        if (cutLongWords && word.length > characters) {
            if (current !== "") {
                lines.push(current)
                current = ""
            }
            let remaining = word
            while (remaining.length > characters) {
                lines.push(remaining.slice(0, characters))
                remaining = remaining.slice(characters)
            }
            current = remaining
        } else if (current === "") {
            current = word
        } else if (current.length + 1 + word.length <= characters) {
            current += ` ${word}`
        } else {
            lines.push(current)
            current = word
        }
    }
    if (current !== "") lines.push(current)
    return lines.join(breakWith)
}

export function words(value: string, count: number, end = "..."): string {
    const parts = value.trim().split(/\s+/)
    if (parts.length <= count) return value
    return parts.slice(0, count).join(" ") + end
}

export function wrap(value: string, before: string, after?: string): string {
    return before + value + (after ?? before)
}

export const Str = {
    after,
    afterLast,
    apa,
    before,
    beforeLast,
    between,
    betweenFirst,
    camel,
    charAt,
    chopEnd,
    chopStart,
    contains,
    containsAll,
    deduplicate,
    doesntContain,
    doesntEndWith,
    doesntStartWith,
    endsWith,
    excerpt,
    finish,
    fromBase64,
    headline,
    initials,
    is,
    isAscii,
    isJson,
    isMatch,
    isUlid,
    isUrl,
    isUuid,
    kebab,
    lcfirst,
    length,
    limit,
    lower,
    ltrim,
    mask,
    match,
    matchAll,
    padBoth,
    padLeft,
    padRight,
    position,
    random,
    remove,
    repeat,
    replace,
    replaceArray,
    replaceEnd,
    replaceFirst,
    replaceLast,
    replaceMatches,
    replaceStart,
    reverse,
    rtrim,
    slug,
    snake,
    squish,
    start,
    startsWith,
    studly,
    substr,
    substrCount,
    substrReplace,
    swap,
    take,
    title,
    toBase64,
    trim,
    ucfirst,
    ucsplit,
    ucwords,
    unwrap,
    upper,
    wordCount,
    wordWrap,
    words,
    wrap,
}

export function registerGlobalStr(): void {
    const globalScope = globalThis as { Str?: typeof Str }
    if (typeof globalScope.Str === "undefined") {
        globalScope.Str = Str
    }
}

export const strTestingHelpers = { splitWords, normalizeForSlug }
