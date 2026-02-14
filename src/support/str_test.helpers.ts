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

export const strTestingHelpers = {
    normalizeForSlug,
    splitWords,
};
