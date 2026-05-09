declare module "svelte" {
    export function setContext(key: unknown, value: unknown): void
    export function getContext<T>(key: unknown): T
    export function mount(component: unknown, options: unknown): unknown
    export function unmount(instance: unknown): void
}

declare module "solid-js/web/dist/server.js" {
    export * from "solid-js/web"
}
