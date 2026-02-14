import { inject, type InjectionKey } from "vue";
import type {
    ContainerContract,
    ContainerIdentifier,
} from "@/container/contract";

export const containerKey: InjectionKey<ContainerContract> = Symbol(
    "application.container",
);

export function useService<T>(identifier: ContainerIdentifier<T>): T {
    const container = inject(containerKey, null);
    if (!container) {
        throw new Error(
            "Application container is not available in Vue context.",
        );
    }

    return container.make<T>(identifier);
}
