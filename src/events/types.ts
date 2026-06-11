export type EventClass<T = unknown> = new (...args: any[]) => T
export type EventIdentifier<T = unknown> = string | EventClass<T>
export type Listener<T = unknown> = (event: T) => void | boolean | Promise<void | boolean>
export type WildcardListener = (eventName: string, data: unknown) => void | Promise<void>
export type Unsubscribe = () => void

export interface ListenerObject<T = unknown> {
    handle(event: T): void | boolean | Promise<void | boolean>
}
