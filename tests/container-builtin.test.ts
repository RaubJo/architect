import { describe, expect, test } from "bun:test";
import "reflect-metadata";
import BuiltinContainer, {
  inject,
} from "@/container/adapters/builtin";

class Logger {
  logs: string[] = [];
}

class ServiceWithCtorInjection {
  constructor(public readonly logger: Logger) {}
}

class ServiceWithTokenInjection {
  constructor(public readonly config: { name: string }) {}
}

class CircularA {
  constructor(public readonly b: CircularB) {}
}

class CircularB {
  constructor(public readonly a: CircularA) {}
}

describe("BuiltinContainer adapter", () => {
  Reflect.defineMetadata("design:paramtypes", [Logger], ServiceWithCtorInjection);
  Reflect.defineMetadata("design:paramtypes", [Object], ServiceWithTokenInjection);
  inject("config")(ServiceWithTokenInjection, undefined, 0);

  test("supports bind/get compatibility", () => {
    const container = new BuiltinContainer();
    container.bind("name").toConstantValue("ioc");

    expect(container.get("name")).toBe("ioc");
    expect(container.make("name")).toBe("ioc");
  });

  test("bind throws when identifier is already bound", () => {
    const container = new BuiltinContainer();
    container.instance("value", 1);

    expect(() => container.bind("value")).toThrow(
      "Cannot bind [value] because it is already bound.",
    );
  });

  test("resolves constructor dependencies from metadata", () => {
    const container = new BuiltinContainer();
    container.singleton(Logger, Logger);
    container.transient(ServiceWithCtorInjection, ServiceWithCtorInjection);

    const service = container.make(ServiceWithCtorInjection);
    expect(service.logger).toBe(container.make(Logger));
  });

  test("resolves token overrides from inject decorator", () => {
    const container = new BuiltinContainer();
    container.instance("config", { name: "app" });
    container.transient(ServiceWithTokenInjection, ServiceWithTokenInjection);

    const service = container.make(ServiceWithTokenInjection);
    expect(service.config).toEqual({ name: "app" });
  });

  test("stores token metadata when inject decorator is applied", () => {
    class ManualInjectTarget {
      constructor(public readonly value: unknown) {}
    }

    inject("manual.token")(ManualInjectTarget, undefined, 0);
    const metadata = (
      Reflect as typeof Reflect & {
        getMetadata?: (key: string, target: object) => Record<number, unknown> | undefined;
      }
    ).getMetadata?.("ioc:inject.tokens", ManualInjectTarget);

    expect(metadata).toBeTruthy();
    expect(metadata?.[0]).toBe("manual.token");
  });

  test("supports singleton and transient scope registration", () => {
    class Counter {
      static next = 0;
      id = ++Counter.next;
    }

    const container = new BuiltinContainer();
    container.singleton("singleton.counter", Counter);
    container.transient("transient.counter", Counter);

    expect(container.make<Counter>("singleton.counter")).toBe(
      container.make("singleton.counter"),
    );
    expect(container.make<Counter>("transient.counter")).not.toBe(
      container.make("transient.counter"),
    );
  });

  test("supports singleton/transient with non-function concrete values", () => {
    const container = new BuiltinContainer();
    container.singleton("singleton.value", 7);
    container.transient("transient.value", 9);

    expect(container.make("singleton.value")).toBe(7);
    expect(container.make("transient.value")).toBe(9);
  });

  test("supports factory registrations", () => {
    const container = new BuiltinContainer();
    container.instance("seed", 5);
    container.singleton("answer", (ioc) => ioc.make<number>("seed") + 37);

    expect(container.make("answer")).toBe(42);
  });

  test("supports fluent dynamic and class registrations", () => {
    const container = new BuiltinContainer();

    class Demo {}

    container.bind("demo").to(Demo).inTransientScope();
    container.bind("demo.singleton").to(Demo).inSingletonScope();
    container
      .bind("value")
      .toDynamicValue(({ container: ioc }) => ioc.make("demo"))
      .inTransientScope();
    container
      .bind("value.singleton")
      .toDynamicValue(({ container: ioc }) => ioc.make("demo.singleton"))
      .inSingletonScope();

    expect(container.make("value")).not.toBe(container.make("value"));
    expect(container.make("value.singleton")).toBe(container.make("value.singleton"));
  });

  test("ignores scope changes after fluent binding is replaced with constant", () => {
    const container = new BuiltinContainer();

    class Demo {}

    const classBinding = container.bind("class.binding");
    const classScopes = classBinding.to(Demo);
    classBinding.toConstantValue("class.constant");
    classScopes.inTransientScope();
    classScopes.inSingletonScope();

    const dynamicBinding = container.bind("dynamic.binding");
    const dynamicScopes = dynamicBinding.toDynamicValue(() => new Demo());
    dynamicBinding.toConstantValue("dynamic.constant");
    dynamicScopes.inTransientScope();
    dynamicScopes.inSingletonScope();

    expect(container.make("class.binding")).toBe("class.constant");
    expect(container.make("dynamic.binding")).toBe("dynamic.constant");
  });

  test("detects circular dependencies", () => {
    Reflect.defineMetadata("design:paramtypes", [CircularB], CircularA);
    Reflect.defineMetadata("design:paramtypes", [CircularA], CircularB);

    const container = new BuiltinContainer();
    expect(() => container.make(CircularA)).toThrow(
      "Circular dependency detected while resolving [CircularA].",
    );
  });

  test("supports bound, has, unbind, unbindAll, and flush", () => {
    const container = new BuiltinContainer();
    container.instance("a", 1);
    container.instance("b", 2);

    expect(container.bound("a")).toBe(true);
    expect(container.has("b")).toBe(true);

    container.unbind("a");
    expect(container.bound("a")).toBe(false);

    container.unbindAll();
    expect(container.bound("b")).toBe(false);

    container.instance("c", 3);
    container.flush();
    expect(container.bound("c")).toBe(false);
  });

  test("throws for unknown string identifiers", () => {
    const container = new BuiltinContainer();
    expect(() => container.make("missing")).toThrow(
      "Container binding [missing] is not registered.",
    );
  });

  test("exposes raw container object", () => {
    const container = new BuiltinContainer();
    expect(container.getRawContainer()).toBeTruthy();
  });
});
