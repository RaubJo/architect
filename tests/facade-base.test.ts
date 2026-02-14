import { afterEach, describe, expect, test } from "bun:test";
import type { ContainerContract } from "@/container/contract";
import InversifyContainer from "@/container/adapters/inversify";
import { Application } from "@/foundation/application";
import Facade from "@/support/facades/facade";

class BrokenFacade extends Facade {
  static callAccessorForTest() {
    return (this as unknown as { getFacadeAccessor: () => unknown }).getFacadeAccessor();
  }
}

class MethodFacade extends Facade {
  protected static getFacadeAccessor() {
    return "method.target";
  }

  static callMethod<T>(method: string, ...args: unknown[]) {
    return (
      this as unknown as {
        callFacadeMethod: <R>(methodName: string, ...values: unknown[]) => R;
      }
    ).callFacadeMethod<T>(method, ...args);
  }
}

class ConcreteFacade extends Facade {
  constructor() {
    super();
  }

  protected static getFacadeAccessor() {
    return "noop";
  }
}

describe("Facade base", () => {
  afterEach(() => {
    Facade.clearResolvedInstances();
    (Application as unknown as { container: ContainerContract | null }).container = null;
  });

  test("throws when accessor is not implemented", () => {
    expect(() => BrokenFacade.callAccessorForTest()).toThrow(
      "Facade does not implement getFacadeAccessor().",
    );
  });

  test("callFacadeMethod dispatches to target method", () => {
    const container = new InversifyContainer();
    container.bind("method.target").toConstantValue({
      sum: (a: number, b: number) => a + b,
    });
    (Application as unknown as { container: ContainerContract | null }).container = container;

    expect(MethodFacade.callMethod<number>("sum", 2, 3)).toBe(5);
  });

  test("callFacadeMethod throws for missing target method", () => {
    const container = new InversifyContainer();
    container.bind("method.target").toConstantValue({});
    (Application as unknown as { container: ContainerContract | null }).container = container;

    expect(() => MethodFacade.callMethod("missing")).toThrow(
      "Method [missing] does not exist on resolved facade instance.",
    );
  });

  test("can clear a single resolved instance", () => {
    const container = new InversifyContainer();
    container.bind("method.target").toConstantValue({
      value: () => "cached",
    });
    (Application as unknown as { container: ContainerContract | null }).container = container;

    expect(MethodFacade.callMethod<string>("value")).toBe("cached");
    Facade.clearResolvedInstance("method.target");
    expect(MethodFacade.callMethod<string>("value")).toBe("cached");
  });

  test("base facade constructor is invokable through subclass", () => {
    const instance = new ConcreteFacade();
    expect(instance).toBeInstanceOf(ConcreteFacade);
  });
});
