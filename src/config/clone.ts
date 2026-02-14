import type { ConfigItems } from "@/config/repository";

export function cloneConfigItems(items: ConfigItems): ConfigItems {
    if (typeof structuredClone === "function") {
        return structuredClone(items) as ConfigItems;
    }

    return JSON.parse(JSON.stringify(items)) as ConfigItems;
}
