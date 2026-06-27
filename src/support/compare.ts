export function compareOp(itemVal: unknown, op: string, val: unknown): boolean {
    switch (op) {
        case "===":
            return itemVal === val
        case "!==":
            return itemVal !== val
        case "==":
        case "=":
            // biome-ignore lint/suspicious/noDoubleEquals: intentional loose equality
            return itemVal == val
        case "!=":
        case "<>":
            // biome-ignore lint/suspicious/noDoubleEquals: intentional loose equality
            return itemVal != val
        case ">":
            return (itemVal as never) > (val as never)
        case "<":
            return (itemVal as never) < (val as never)
        case ">=":
            return (itemVal as never) >= (val as never)
        case "<=":
            return (itemVal as never) <= (val as never)
        default:
            return false
    }
}
