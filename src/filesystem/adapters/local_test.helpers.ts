function fileNameWithoutExtension(path: string): string {
    const file = path.split("/").pop() ?? path;
    return file.replace(/\.[^/.]+$/, "");
}

function normalizeBasePath(basePath: string): string {
    const trimmed = basePath.trim();
    if (!trimmed || trimmed === "." || trimmed === "./" || trimmed === "/") {
        return "";
    }

    let normalized = trimmed.replace(/\\/g, "/");
    normalized = normalized.replace(/^\.\//, "");
    normalized = normalized.replace(/^\/+/, "");
    normalized = normalized.replace(/\/+$/, "");

    return normalized;
}

function isPathInConfigDirectories(path: string, basePath: string): boolean {
    const normalizedPath = path.replace(/\\/g, "/");
    const trimmedPath = normalizedPath.replace(/^\/+/, "").replace(/^\.\//, "");
    const normalizedBasePath = normalizeBasePath(basePath);

    const targets =
        normalizedBasePath ?
            [
                `${normalizedBasePath}/config/`,
                `${normalizedBasePath}/src/config/`,
            ]
        :   ["config/", "src/config/"];

    for (const target of targets) {
        if (
            trimmedPath.startsWith(target) ||
            normalizedPath.includes(`/${target}`) ||
            normalizedPath.endsWith(`/${target.slice(0, -1)}`)
        ) {
            return true;
        }
    }

    return false;
}

export const localAdapterTestingHelpers = {
    fileNameWithoutExtension,
    normalizeBasePath,
    isPathInConfigDirectories,
};
