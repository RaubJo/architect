function fileNameWithoutExtension(path: string): string {
    const file = path.split("/").pop() ?? path
    return file.replace(/\.[^/.]+$/, "")
}

function normalizeBasePath(basePath: string): string {
    const trimmed = basePath.trim()
    if (isRootBasePath(trimmed)) {
        return ""
    }

    let normalized = trimmed.replace(/\\/g, "/")
    normalized = normalized.replace(/^\.\//, "")
    normalized = normalized.replace(/^\/+/, "")
    normalized = normalized.replace(/\/+$/, "")

    return normalized
}

function isRootBasePath(basePath: string): boolean {
    return ["", ".", "./", "/"].includes(basePath)
}

function isPathInConfigDirectories(path: string, basePath: string): boolean {
    const normalizedPath = path.replace(/\\/g, "/")
    const trimmedPath = normalizedPath.replace(/^\/+/, "").replace(/^\.\//, "")
    const normalizedBasePath = normalizeBasePath(basePath)
    const targets = configDirectoryTargets(normalizedBasePath)

    return targets.some((target) => matchesConfigDirectory(normalizedPath, trimmedPath, target))
}

function configDirectoryTargets(basePath: string): string[] {
    return basePath ? [`${basePath}/config/`, `${basePath}/src/config/`] : ["config/", "src/config/"]
}

function matchesConfigDirectory(normalizedPath: string, trimmedPath: string, target: string): boolean {
    return (
        trimmedPath.startsWith(target) ||
        normalizedPath.includes(`/${target}`) ||
        normalizedPath.endsWith(`/${target.slice(0, -1)}`)
    )
}

export const localAdapterTestingHelpers = {
    fileNameWithoutExtension,
    normalizeBasePath,
    isPathInConfigDirectories,
}
