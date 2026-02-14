import { Container, type BindToFluentSyntax, type Newable } from "inversify";
import type {
    ContainerBindToSyntax,
    ContainerConcrete,
    ContainerContract,
    ContainerFactory,
    ContainerIdentifier,
} from "@/container/contract";

function isClassConcrete<T>(value: ContainerConcrete<T>): value is Newable<T> {
    return (
        typeof value === "function" &&
        Object.prototype.hasOwnProperty.call(value, "prototype")
    );
}

function isFactoryConcrete<T>(
    value: ContainerConcrete<T>,
): value is ContainerFactory<T> {
    return typeof value === "function" && !isClassConcrete(value);
}

export default class InversifyContainer implements ContainerContract {
    protected container: Container;

    constructor(container = new Container({ defaultScope: "Singleton" })) {
        this.container = container;
    }

    bind<T>(identifier: ContainerIdentifier<T>): ContainerBindToSyntax<T> {
        return this.container.bind<T>(
            identifier,
        ) as unknown as BindToFluentSyntax<T> & ContainerBindToSyntax<T>;
    }

    singleton<T>(
        identifier: ContainerIdentifier<T>,
        concrete: ContainerConcrete<T>,
    ): this {
        this.removeIfBound(identifier);

        const binding = this.container.bind(identifier);
        if (isClassConcrete(concrete)) {
            binding.to(concrete).inSingletonScope();
            return this;
        }

        if (isFactoryConcrete(concrete)) {
            binding.toDynamicValue(() => concrete(this)).inSingletonScope();
            return this;
        }

        binding.toConstantValue(concrete as T);
        return this;
    }

    transient<T>(
        identifier: ContainerIdentifier<T>,
        concrete: ContainerConcrete<T>,
    ): this {
        this.removeIfBound(identifier);

        const binding = this.container.bind(identifier);
        if (isClassConcrete(concrete)) {
            binding.to(concrete).inTransientScope();
            return this;
        }

        if (isFactoryConcrete(concrete)) {
            binding.toDynamicValue(() => concrete(this)).inTransientScope();
            return this;
        }

        binding.toDynamicValue(() => concrete as T).inTransientScope();
        return this;
    }

    instance<T>(identifier: ContainerIdentifier<T>, value: T): this {
        this.removeIfBound(identifier);
        this.container.bind(identifier).toConstantValue(value);
        return this;
    }

    make<T>(identifier: ContainerIdentifier<T>): T {
        return this.container.get<T>(identifier);
    }

    get<T>(identifier: ContainerIdentifier<T>): T {
        return this.make<T>(identifier);
    }

    bound(identifier: ContainerIdentifier): boolean {
        return this.container.isBound(identifier);
    }

    has(identifier: ContainerIdentifier): boolean {
        return this.bound(identifier);
    }

    unbind(identifier: ContainerIdentifier): void {
        if (this.container.isBound(identifier)) {
            this.container.unbind(identifier);
        }
    }

    unbindAll(): void {
        this.container.unbindAll();
    }

    flush(): void {
        this.unbindAll();
    }

    getRawContainer(): unknown {
        return this.container;
    }

    protected removeIfBound(identifier: ContainerIdentifier): void {
        if (this.container.isBound(identifier)) {
            this.container.unbind(identifier);
        }
    }
}
