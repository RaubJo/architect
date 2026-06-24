export type EventClass<T = unknown> = new (...args: any[]) => T
export type EventIdentifier<T = unknown> = string | EventClass<T>
export type Listener<T = unknown> = (event: T) => void | boolean | Promise<void | boolean>
export type WildcardListener = (eventName: string, data: unknown) => void | Promise<void>
export type Unsubscribe = () => void

export interface ListenerObject<T = unknown> {
    handle(event: T): void | boolean | Promise<void | boolean>
}

export interface EventSubscriber {
    subscribe(bus: Bus): Record<string, Listener | string> | void
}

export class Bus {
    protected listeners = new Map<string, Listener[]>()
    protected wildcardListeners: WildcardListener[] = []
    protected pushedEvents = new Map<string, Record<string, unknown>[]>()

    listen<T>(
        event: EventIdentifier<T> | Array<EventIdentifier<T>>,
        listener: Listener<T> | ListenerObject<T>,
    ): Unsubscribe {
        const events = Array.isArray(event) ? event : [event]
        const normalized = this.normalizeListener(listener) as Listener
        const unsubscribers: Unsubscribe[] = []

        for (const ev of events) {
            const name = this.resolveEventName(ev)

            if (name === "*") {
                const wl: WildcardListener = (_name, data) => void normalized(data as T)
                this.wildcardListeners.push(wl)
                unsubscribers.push(() => {
                    const idx = this.wildcardListeners.indexOf(wl)
                    if (idx !== -1) this.wildcardListeners.splice(idx, 1)
                })
                continue
            }

            const current = this.listeners.get(name) ?? []
            current.push(normalized)
            this.listeners.set(name, current)

            unsubscribers.push(() => {
                const all = this.listeners.get(name) ?? []
                const updated = all.filter((l) => l !== normalized)
                if (updated.length === 0) {
                    this.listeners.delete(name)
                } else {
                    this.listeners.set(name, updated)
                }
            })
        }

        return () => {
            unsubscribers.forEach((fn) => {
                fn()
            })
        }
    }

    once<T>(event: EventIdentifier<T>, listener: Listener<T> | ListenerObject<T>): Unsubscribe {
        const normalized = this.normalizeListener(listener)
        let unsubscribe!: Unsubscribe

        const wrapped: Listener<T> = async (data: T) => {
            unsubscribe()
            return normalized(data)
        }

        unsubscribe = this.listen(event, wrapped)
        return unsubscribe
    }

    subscribe(subscriber: EventSubscriber | (new () => EventSubscriber)): void {
        const instance = typeof subscriber === "function" ? new subscriber() : subscriber
        const mappings = instance.subscribe(this)

        if (!mappings) return

        for (const [event, handler] of Object.entries(mappings)) {
            const listener =
                typeof handler === "string"
                    ? (data: unknown) => (instance as unknown as Record<string, Listener>)[handler]?.(data)
                    : (handler as Listener)
            this.listen(event, listener)
        }
    }

    async dispatch<T>(event: T | string, payload?: unknown): Promise<void> {
        const [name, data] = this.parseEventAndPayload(event, payload)

        for (const wl of [...this.wildcardListeners]) {
            await wl(name, data)
        }

        const listeners = [...(this.listeners.get(name) ?? [])]
        for (const listener of listeners) {
            await listener(data)
        }
    }

    fire<T>(event: T | string, payload?: unknown): Promise<void> {
        return this.dispatch(event, payload)
    }

    async until<T>(event: T | string, payload?: unknown): Promise<unknown> {
        const [name, data] = this.parseEventAndPayload(event, payload)

        const listeners = [...(this.listeners.get(name) ?? [])]
        for (const listener of listeners) {
            const result = await listener(data)
            if (result !== null && result !== false && result !== undefined) {
                return result
            }
        }
        return null
    }

    push(event: string, payload: Record<string, unknown> = {}): void {
        const queued = this.pushedEvents.get(event) ?? []
        queued.push(payload)
        this.pushedEvents.set(event, queued)
    }

    async flush(event: string): Promise<void> {
        const queued = [...(this.pushedEvents.get(event) ?? [])]
        this.pushedEvents.delete(event)
        for (const payload of queued) {
            await this.dispatch(event, payload)
        }
    }

    forget(event: EventIdentifier): void {
        this.listeners.delete(this.resolveEventName(event))
    }

    forgetPushed(): void {
        this.pushedEvents.clear()
    }

    hasListeners(event: EventIdentifier): boolean {
        const name = this.resolveEventName(event)
        return (this.listeners.get(name)?.length ?? 0) > 0 || this.wildcardListeners.length > 0
    }

    protected resolveEventName(event: unknown): string {
        if (typeof event === "string") return event
        if (typeof event === "function") {
            // EventClass passed directly — prefer static label (minification-safe)
            if ("label" in event && typeof event.label === "string") return event.label as string
            return (event as EventClass).name
        }
        // Event instance — read label/name from its constructor
        const ctor = (event as object)?.constructor
        if (ctor && "label" in ctor && typeof (ctor as { label: unknown }).label === "string") {
            return (ctor as { label: string }).label
        }
        return ctor?.name ?? ""
    }

    protected parseEventAndPayload<T>(event: T | string, payload?: unknown): [string, unknown] {
        const name = this.resolveEventName(event)
        const data = typeof event === "string" ? (payload ?? {}) : event
        return [name, data]
    }

    protected normalizeListener<T>(listener: Listener<T> | ListenerObject<T>): Listener<T> {
        if (typeof listener === "function") return listener
        return (event: T) => listener.handle(event)
    }
}
