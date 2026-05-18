import { defineComponent, h, inject, onUnmounted, provide, type InjectionKey } from "vue"
import type { ContainerContract, ContainerIdentifier } from "../container/contract"
import type { Application } from "../foundation/application"

export const containerKey: InjectionKey<ContainerContract> = Symbol("application.container")

export const ContextProvider = defineComponent({
    name: "ArchitectContextProvider",
    props: {
        application: { type: Object as () => Application, required: false },
        container: { type: Object as () => ContainerContract, required: false },
    },
    setup(props, { slots }) {
        if (!props.application && !props.container) {
            throw new Error("ContextProvider requires either `application` or `container`.")
        }

        const runtime = props.container ? { container: props.container, stop: () => {} } : props.application!.run()

        provide(containerKey, runtime.container)
        onUnmounted(() => runtime.stop())

        return () => slots.default?.() ?? []
    },
})

export function useService<T>(identifier: ContainerIdentifier<T>): T {
    const container = inject(containerKey, null)
    if (!container) {
        throw new Error("Application container is not available in Vue context.")
    }

    return container.make<T>(identifier)
}
