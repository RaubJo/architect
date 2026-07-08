export type Unsubscribe = () => void

export class Signal<T> {
    #value: T
    #listeners = new Set<(value: T) => void>()

    constructor(value: T) {
        this.#value = value
    }

    get(): T {
        return this.#value
    }

    set(value: T): void {
        if (Object.is(value, this.#value)) return
        this.#value = value
        for (const listener of this.#listeners) listener(value)
    }

    update(fn: (value: T) => T): void {
        this.set(fn(this.#value))
    }

    subscribe(listener: (value: T) => void): Unsubscribe {
        this.#listeners.add(listener)
        return () => this.#listeners.delete(listener)
    }
}
