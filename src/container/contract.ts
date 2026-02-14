export type ContainerFactory<T> = (container: ContainerContract) => T;
export type ContainerClass<T> = new (...args: any[]) => T;
export type ContainerIdentifier<T = unknown> =
    | string
    | symbol
    | ContainerClass<T>;
export type ContainerConcrete<T> = ContainerClass<T> | ContainerFactory<T> | T;

export interface ContainerScopeSyntax {
    /** Set singleton scope for this binding. */
    inSingletonScope(): void;
    /** Set transient scope for this binding. */
    inTransientScope(): void;
}

export interface ContainerBindToSyntax<T> {
    /** Bind an identifier to a concrete class. */
    to(concrete: ContainerClass<T>): ContainerScopeSyntax;
    /** Bind an identifier to a dynamic factory callback. */
    toDynamicValue(
        concrete: (context: { container: ContainerContract }) => T,
    ): ContainerScopeSyntax;
    /** Bind an identifier to a constant shared value. */
    toConstantValue(value: T): void;
}

export interface ContainerContract {
    /** Register a binding fluent definition for an identifier. */
    bind<T>(identifier: ContainerIdentifier<T>): ContainerBindToSyntax<T>;
    /** Register a singleton binding using a class, factory, or value concrete. */
    singleton<T>(
        identifier: ContainerIdentifier<T>,
        concrete: ContainerConcrete<T>,
    ): this;
    /** Register a transient binding using a class, factory, or value concrete. */
    transient<T>(
        identifier: ContainerIdentifier<T>,
        concrete: ContainerConcrete<T>,
    ): this;
    /** Register an existing instance as a shared binding. */
    instance<T>(identifier: ContainerIdentifier<T>, value: T): this;
    /** Resolve an instance from the container. */
    make<T>(identifier: ContainerIdentifier<T>): T;
    /** Compatibility alias for make(). */
    get<T>(identifier: ContainerIdentifier<T>): T;
    /** Determine if an identifier is currently bound. */
    bound(identifier: ContainerIdentifier): boolean;
    /** Alias for bound(). */
    has(identifier: ContainerIdentifier): boolean;
    /** Remove a specific binding by identifier. */
    unbind(identifier: ContainerIdentifier): void;
    /** Remove all bindings from the container. */
    unbindAll(): void;
    /** Clear all bindings. */
    flush(): void;
    /** Expose the underlying container for advanced use. */
    getRawContainer(): unknown;
}
