import type {
    ContainerClass,
    ContainerBindToSyntax,
    ContainerConcrete,
    ContainerContract,
    ContainerFactory,
    ContainerIdentifier,
} from "@/container/contract";

const INJECT_TOKENS_METADATA_KEY = "ioc:inject.tokens";

type Scope = "singleton" | "transient";

type BindingRecord<T = unknown> =
    | {
          kind: "constant";
          value: T;
      }
    | {
          kind: "class";
          concrete: ContainerClass<T>;
          scope: Scope;
          cached?: T;
      }
    | {
          kind: "factory";
          concrete: ContainerFactory<T>;
          scope: Scope;
          cached?: T;
      };

type MetadataReflect = typeof Reflect & {
    defineMetadata?: (key: string, value: unknown, target: object) => void;
    getMetadata?: (key: string, target: object) => unknown;
};

const metadataReflect = Reflect as MetadataReflect;

function isClassConcrete<T>(
    value: ContainerConcrete<T>,
): value is ContainerClass<T> {
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

function readInjectTokens(target: object): Map<number, ContainerIdentifier> {
    const metadata = metadataReflect.getMetadata?.(
        INJECT_TOKENS_METADATA_KEY,
        target,
    ) as Record<number, ContainerIdentifier> | undefined;

    const tokens = new Map<number, ContainerIdentifier>();
    if (!metadata) {
        return tokens;
    }

    for (const [index, identifier] of Object.entries(metadata)) {
        tokens.set(Number(index), identifier);
    }

    return tokens;
}

class BuiltinBindingFluent<T> {
    protected record: BindingRecord<T> | null = null;

    constructor(
        protected readonly container: BuiltinContainer,
        protected readonly identifier: ContainerIdentifier<T>,
    ) {}

    to(concrete: ContainerClass<T>): {
        inSingletonScope: () => void;
        inTransientScope: () => void;
    } {
        this.record = { kind: "class", concrete, scope: "singleton" };
        this.container.setRecord(this.identifier, this.record);

        return {
            inSingletonScope: () => {
                if (this.record && this.record.kind !== "constant") {
                    this.record.scope = "singleton";
                }
            },
            inTransientScope: () => {
                if (this.record && this.record.kind !== "constant") {
                    this.record.scope = "transient";
                    delete this.record.cached;
                }
            },
        };
    }

    toDynamicValue(
        concrete: (context: { container: ContainerContract }) => T,
    ): { inSingletonScope: () => void; inTransientScope: () => void } {
        this.record = {
            kind: "factory",
            concrete: () => concrete({ container: this.container }),
            scope: "singleton",
        };
        this.container.setRecord(this.identifier, this.record);

        return {
            inSingletonScope: () => {
                if (this.record && this.record.kind !== "constant") {
                    this.record.scope = "singleton";
                }
            },
            inTransientScope: () => {
                if (this.record && this.record.kind !== "constant") {
                    this.record.scope = "transient";
                    delete this.record.cached;
                }
            },
        };
    }

    toConstantValue(value: T): void {
        this.record = { kind: "constant", value };
        this.container.setRecord(this.identifier, this.record);
    }
}

export function inject(identifier: ContainerIdentifier): ParameterDecorator {
    return (target, _propertyKey, parameterIndex) => {
        const existing =
            (metadataReflect.getMetadata?.(
                INJECT_TOKENS_METADATA_KEY,
                target,
            ) as Record<number, ContainerIdentifier> | undefined) ?? {};
        existing[parameterIndex] = identifier;
        metadataReflect.defineMetadata?.(
            INJECT_TOKENS_METADATA_KEY,
            existing,
            target,
        );
    };
}

export default class BuiltinContainer implements ContainerContract {
    protected bindings = new Map<ContainerIdentifier, BindingRecord>();
    protected resolving = new Set<ContainerIdentifier>();

    bind<T>(identifier: ContainerIdentifier<T>): ContainerBindToSyntax<T> {
        if (this.bindings.has(identifier)) {
            throw new Error(
                `Cannot bind [${String(identifier)}] because it is already bound.`,
            );
        }

        return new BuiltinBindingFluent<T>(this, identifier);
    }

    singleton<T>(
        identifier: ContainerIdentifier<T>,
        concrete: ContainerConcrete<T>,
    ): this {
        this.removeIfBound(identifier);

        if (isClassConcrete(concrete)) {
            this.bindings.set(identifier, {
                kind: "class",
                concrete,
                scope: "singleton",
            });
            return this;
        }

        if (isFactoryConcrete(concrete)) {
            this.bindings.set(identifier, {
                kind: "factory",
                concrete,
                scope: "singleton",
            });
            return this;
        }

        this.bindings.set(identifier, {
            kind: "constant",
            value: concrete as T,
        });
        return this;
    }

    transient<T>(
        identifier: ContainerIdentifier<T>,
        concrete: ContainerConcrete<T>,
    ): this {
        this.removeIfBound(identifier);

        if (isClassConcrete(concrete)) {
            this.bindings.set(identifier, {
                kind: "class",
                concrete,
                scope: "transient",
            });
            return this;
        }

        if (isFactoryConcrete(concrete)) {
            this.bindings.set(identifier, {
                kind: "factory",
                concrete,
                scope: "transient",
            });
            return this;
        }

        this.bindings.set(identifier, {
            kind: "factory",
            concrete: () => concrete as T,
            scope: "transient",
        });
        return this;
    }

    instance<T>(identifier: ContainerIdentifier<T>, value: T): this {
        this.removeIfBound(identifier);
        this.bindings.set(identifier, { kind: "constant", value });
        return this;
    }

    make<T>(identifier: ContainerIdentifier<T>): T {
        const record = this.bindings.get(identifier);
        if (record) {
            return this.resolveRecord(record, identifier) as T;
        }

        if (typeof identifier === "function") {
            return this.resolveClass(identifier as ContainerClass<T>);
        }

        throw new Error(
            `Container binding [${String(identifier)}] is not registered.`,
        );
    }

    get<T>(identifier: ContainerIdentifier<T>): T {
        return this.make(identifier);
    }

    bound(identifier: ContainerIdentifier): boolean {
        return this.bindings.has(identifier);
    }

    has(identifier: ContainerIdentifier): boolean {
        return this.bound(identifier);
    }

    unbind(identifier: ContainerIdentifier): void {
        this.bindings.delete(identifier);
    }

    unbindAll(): void {
        this.bindings.clear();
        this.resolving.clear();
    }

    flush(): void {
        this.unbindAll();
    }

    getRawContainer(): unknown {
        return this.bindings;
    }

    setRecord<T>(
        identifier: ContainerIdentifier<T>,
        record: BindingRecord<T>,
    ): void {
        this.bindings.set(identifier, record as BindingRecord);
    }

    protected removeIfBound(identifier: ContainerIdentifier): void {
        this.bindings.delete(identifier);
    }

    protected resolveRecord<T>(
        record: BindingRecord<T>,
        identifier: ContainerIdentifier,
    ): T {
        if (record.kind === "constant") {
            return record.value;
        }

        if (
            record.scope === "singleton" &&
            "cached" in record &&
            typeof record.cached !== "undefined"
        ) {
            return record.cached;
        }

        const resolved =
            record.kind === "class" ?
                this.resolveClass(record.concrete)
            :   record.concrete(this);

        if (record.scope === "singleton") {
            record.cached = resolved;
        }

        return resolved;
    }

    protected resolveClass<T>(concrete: ContainerClass<T>): T {
        if (this.resolving.has(concrete)) {
            throw new Error(
                `Circular dependency detected while resolving [${concrete.name || "anonymous"}].`,
            );
        }

        this.resolving.add(concrete);

        try {
            const paramTypes =
                (metadataReflect.getMetadata?.(
                    "design:paramtypes",
                    concrete,
                ) as Array<ContainerIdentifier | undefined> | undefined) ?? [];
            const injectTokens = readInjectTokens(concrete);
            const args = paramTypes.map((designType, index) => {
                const token = injectTokens.get(index) ?? designType;
                if (!token) {
                    throw new Error(
                        `Cannot resolve parameter #${index} for [${concrete.name || "anonymous"}].`,
                    );
                }

                return this.make(token);
            });

            return new concrete(...args);
        } finally {
            this.resolving.delete(concrete);
        }
    }
}
