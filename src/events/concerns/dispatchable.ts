import { Event } from "../../support/facades/event"

export abstract class Dispatchable {
    static dispatch<TThis extends new (...args: any[]) => Dispatchable>(
        this: TThis,
        ...args: ConstructorParameters<TThis>
    ): Promise<void> {
        return Event.dispatch(new this(...args)) as Promise<void>
    }
}
