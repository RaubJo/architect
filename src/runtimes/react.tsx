import { createContext, useContext, type ReactNode } from "react";
import type {
    ContainerContract,
    ContainerIdentifier,
} from "@/container/contract";

const ContainerContext = createContext<ContainerContract | null>(null);

type ApplicationProviderProps = {
    container: ContainerContract;
    children?: ReactNode;
};

export function ApplicationProvider({
    container,
    children,
}: ApplicationProviderProps) {
    return (
        <ContainerContext.Provider value={container}>
            {children}
        </ContainerContext.Provider>
    );
}

export function useService<T>(identifier: ContainerIdentifier<T>): T {
    const container = useContext(ContainerContext);
    if (!container) {
        throw new Error(
            "Application container is not available in React context.",
        );
    }

    return container.make<T>(identifier);
}
