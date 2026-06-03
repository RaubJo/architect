# Event bus addition to architect-core

Two artifacts to add to the architect repo. The ADR goes in `docs/adr/`. The language block merges into the existing sections of `CONTEXT.md`.

---

## docs/todos/0001-event-bus-and-dispatchable-trait.md

# Event bus and Dispatchable ship in architect-core

An `EventBus` (the `Bus` class) and its matching `Event` facade are added to the package alongside the existing `StorageManager`/`Store` and `CacheManager`/`Cache` pairs. The pattern is identical: a service class bound under a well-known container key and a facade that proxies it statically. Exposing the bus as a subpath export (`@raubjo/architect-core/events/bus`, `@raubjo/architect-core/facades/event`) keeps bundle impact zero for consumers who do not use it.

A `Dispatchable` abstract base class ships under `@raubjo/architect-core/events/concerns/dispatchable`. It adds a single static `dispatch(...args)` method that constructs an instance of the calling class and dispatches it through the `Event` facade. This makes event classes self-dispatching — `UserRegistered.dispatch(user)` rather than `Event.dispatch(new UserRegistered(user))` — following the same convention as Laravel's `Dispatchable` trait. The tradeoff is that event classes carry a compile-time dependency on the facade. This is acceptable because the dispatch capability is the reason the classes exist; an event class that cannot be dispatched is not more loosely coupled, it is just incomplete.

The `Bus` resolves event identifiers by checking for a `label` string property on the event object before falling back to `constructor.name`. This makes routing minification-safe for any event class that declares a static label — a convention we expect consuming frameworks to follow but do not enforce.

```ts
// /src/events/concerns/dispactable.ts

import { Event } from "../facade"

export abstract class Dispatchable {
    static dispatch<TThis extends new (...args: any[]) => Dispatchable>(
        this: TThis,
        ...args: ConstructorParameters<TThis>
    ): Promise<void> {
        return Event.dispatch(new this(...args)) as Promise<void>
    }
}

```

```ts
// /src/events/bus.ts

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
    private listeners = new Map<string, Listener[]>()
    private wildcardListeners: WildcardListener[] = []
    private pushedEvents = new Map<string, Record<string, unknown>[]>()

    listen<T>(
        event: EventIdentifier<T> | Array<EventIdentifier<T>>,
        listener: Listener<T> | ListenerObject<T>,
    ): Unsubscribe {
        const events = Array.isArray(event) ? event : [event]
        const normalized = this.normalizeListener(listener) as Listener
        const unsubscribers: Unsubscribe[] = []

        for (const ev of events) {
            const name = this.eventName(ev)

            if (name === '*') {
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

        return () => unsubscribers.forEach((fn) => fn())
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
        const instance = typeof subscriber === 'function' ? new subscriber() : subscriber
        const mappings = instance.subscribe(this)

        if (!mappings) return

        for (const [event, handler] of Object.entries(mappings)) {
            const listener =
                typeof handler === 'string'
                    ? (data: unknown) =>
                          (instance as unknown as Record<string, Listener>)[handler]?.(data)
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
        this.listeners.delete(this.eventName(event))
    }

    forgetPushed(): void {
        this.pushedEvents.clear()
    }

    hasListeners(event: EventIdentifier): boolean {
        const name = this.eventName(event)
        return (this.listeners.get(name)?.length ?? 0) > 0 || this.wildcardListeners.length > 0
    }

    private eventName(event: EventIdentifier): string {
        if (typeof event === 'string') return event
        return (event as EventClass).name
    }

    private parseEventAndPayload<T>(
        event: T | string,
        payload?: unknown,
    ): [string, unknown] {
        if (typeof event === 'string') {
            return [event, payload ?? {}]
        }
        // Prefer a label property over constructor.name (minification-safe, WorkbenchEvent convention)
        if (event && typeof event === 'object' && 'label' in event && typeof (event as { label: unknown }).label === 'string') {
            return [(event as { label: string }).label, event]
        }
        return [(event as object).constructor.name, event]
    }

    private normalizeListener<T>(listener: Listener<T> | ListenerObject<T>): Listener<T> {
        if (typeof listener === 'function') return listener
        return (event: T) => listener.handle(event)
    }
}

```

```ts
// /src/events/provider.ts

import { ServiceProvider, ServiceProviderContext } from @raubjo/architect-core"
import { Bus } from "./bus"

export class Provider extends ServiceProvider
{
    register(context: ServiceProviderContext)
    {
        context.container.singleton('events', () => new Bus())
    }
}

```

```ts
// /src/support/facades/event.ts

import { createFacade } from "@raubjo/architect-core/facade"
import type { Bus } from "./bus"

export const Event = createFacade<Bus>("events")
export default Event

```

---

## CONTEXT.md additions

Add to the **Language** section:

**EventBus**:
The pub/sub dispatcher — a `Bus` class that maps string event identifiers to ordered listener arrays. Supports named events, class-constructor identifiers, wildcard listeners (`*`), one-shot listeners (`once`), push/flush queuing, and subscriber objects. Bound in the container under `"events"` by `EventServiceProvider`.
_Avoid_: event emitter, event dispatcher (use "EventBus" or "Bus")

**Event** (facade):
The static proxy for the `EventBus`, following the same pattern as `Store` and `Cache`. Safe to call from `boot()` onward. Primary methods: `dispatch`, `listen`, `forget`, `until`.
_Avoid_: global event bus, static dispatcher

**Dispatchable**:
An abstract base class that adds a static `dispatch(...constructorArgs)` method to any event class that extends it. Constructs the instance and routes it through the `Event` facade. Event classes that extend `Dispatchable` are self-dispatching: `MyEvent.dispatch(payload)`.
_Avoid_: dispatchable trait (TypeScript has no traits; it is a class)

**Event label**:
A string constant declared as `static readonly label` on an event class (e.g. `"tab.created"`). The `Bus` prefers this over `constructor.name` when routing, making dispatch minification-safe. Consuming frameworks define their own label convention; the `Bus` does not enforce one.
_Avoid_: event name, event key (use "event label" or "label")

Add to the **Relationships** section:

- An **EventBus** holds listener registrations keyed by **event label** or constructor name
- An **Event** facade resolves the **EventBus** from the current **Application**'s container
- A **Dispatchable** class dispatches itself through the **Event** facade
- A **ServiceProvider** binds the **EventBus** singleton and may register listeners in `boot()`

