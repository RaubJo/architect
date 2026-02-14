import { createContext, createComponent, useContext, type JSX } from "solid-js";
import type {
    ContainerContract,
    ContainerIdentifier,
} from "@/container/contract";

const ContainerContext = createContext<ContainerContract | null>(null);

type ApplicationProviderProps = {
    container: ContainerContract;
    children?: JSX.Element | (() => JSX.Element);
};

export function ApplicationProvider(props: ApplicationProviderProps) {
    return createComponent(ContainerContext.Provider, {
        value: props.container,
        children: props.children as never,
    });
}

export function useService<T>(identifier: ContainerIdentifier<T>): T {
    const container = useContext(ContainerContext);
    if (!container) {
        throw new Error(
            "Application container is not available in Solid context.",
        );
    }

    return container.make<T>(identifier);
}
