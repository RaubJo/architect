import { Application } from "../../foundation/application";

export default abstract class Facade {
    protected static resolvedInstance = new Map<
        Parameters<typeof Application.make>[0],
        unknown
    >();

    protected constructor() {}

    protected static getFacadeAccessor(): Parameters<
        typeof Application.make
    >[0] {
        throw new Error("Facade does not implement getFacadeAccessor().");
    }

    static clearResolvedInstance(
        name: Parameters<typeof Application.make>[0],
    ): void {
        this.resolvedInstance.delete(name);
    }

    static clearResolvedInstances(): void {
        this.resolvedInstance.clear();
    }

    protected static resolveFacadeInstance<T>(): T {
        const accessor = this.getFacadeAccessor();

        if (this.resolvedInstance.has(accessor)) {
            return this.resolvedInstance.get(accessor) as T;
        }

        const instance = Application.make<T>(accessor);
        this.resolvedInstance.set(accessor, instance);

        return instance;
    }

    protected static callFacadeMethod<T = unknown>(
        method: string,
        ...args: unknown[]
    ): T {
        const instance =
            this.resolveFacadeInstance<
                Record<string, (...a: unknown[]) => unknown>
            >();
        const callable = instance[method];
        if (typeof callable !== "function") {
            throw new Error(
                `Method [${method}] does not exist on resolved facade instance.`,
            );
        }

        return callable.apply(instance, args) as T;
    }
}
