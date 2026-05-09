export function format(value: number, precision?: number, locale?: string): string {
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
    }).format(value)
}

export function percentage(value: number, precision = 0, locale?: string): string {
    return new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
    }).format(value / 100)
}

export function currency(value: number, currencyCode = "USD", locale?: string): string {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
    }).format(value)
}

export function fileSize(bytes: number, precision = 0): string {
    const units = ["B", "KB", "MB", "GB", "TB"]
    let size = bytes
    let unit = 0
    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024
        unit++
    }
    return `${size.toFixed(precision)} ${units[unit]}`
}

export function abbreviate(value: number, precision = 0, locale?: string): string {
    const abs = Math.abs(value)
    if (abs >= 1_000_000_000) return `${format(value / 1_000_000_000, precision, locale)}B`
    if (abs >= 1_000_000) return `${format(value / 1_000_000, precision, locale)}M`
    if (abs >= 1_000) return `${format(value / 1_000, precision, locale)}K`
    return format(value, precision, locale)
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}

export function between(value: number, min: number, max: number): boolean {
    return value >= min && value <= max
}

export const Num = { format, percentage, currency, fileSize, abbreviate, clamp, between }
