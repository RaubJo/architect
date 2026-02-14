function splitWords(value: string): string[] {
    const normalized = value
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_\-.]+/g, " ")
        .trim();

    if (!normalized) {
        return [];
    }

    return normalized.split(/\s+/);
}

function normalizeForSlug(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export default class Str {
    constructor() {}

    static lower(value: string): string {
        return value.toLowerCase();
    }

    static upper(value: string): string {
        return value.toUpperCase();
    }

    static length(value: string): number {
        return value.length;
    }

    static contains(
        haystack: string,
        needle: string | string[],
        ignoreCase = false,
    ): boolean {
        const source = ignoreCase ? haystack.toLowerCase() : haystack;
        const needles = Array.isArray(needle) ? needle : [needle];

        for (const part of needles) {
            const target = ignoreCase ? part.toLowerCase() : part;
            if (source.includes(target)) {
                return true;
            }
        }

        return false;
    }

    static startsWith(haystack: string, needle: string | string[]): boolean {
        const needles = Array.isArray(needle) ? needle : [needle];
        for (const part of needles) {
            if (haystack.startsWith(part)) {
                return true;
            }
        }

        return false;
    }

    static endsWith(haystack: string, needle: string | string[]): boolean {
        const needles = Array.isArray(needle) ? needle : [needle];
        for (const part of needles) {
            if (haystack.endsWith(part)) {
                return true;
            }
        }

        return false;
    }

    static replace(
        search: string | RegExp,
        replace: string,
        subject: string,
    ): string {
        return subject.replace(search, replace);
    }

    static snake(value: string, separator = "_"): string {
        const words = splitWords(value).map((word) => word.toLowerCase());
        return words.join(separator);
    }

    static kebab(value: string): string {
        return Str.snake(value, "-");
    }

    static studly(value: string): string {
        const words = splitWords(value);
        let output = "";
        for (const word of words) {
            output +=
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }

        return output;
    }

    static camel(value: string): string {
        const studly = Str.studly(value);
        if (!studly) {
            return "";
        }

        return studly.charAt(0).toLowerCase() + studly.slice(1);
    }

    static slug(value: string, separator = "-"): string {
        const slugged = normalizeForSlug(value);
        if (separator === "-") {
            return slugged;
        }

        return slugged.replace(/-/g, separator);
    }
}

export function registerGlobalStr(): void {
    const globalScope = globalThis as { Str?: typeof Str };
    if (typeof globalScope.Str === "undefined") {
        globalScope.Str = Str;
    }
}
