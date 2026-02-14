import { describe, expect, test } from "bun:test";
import InversifyContainer from "@/container/adapters/inversify";

class SingletonService {
  static nextId = 0;
  id = ++SingletonService.nextId;
}

class TransientService {
  static nextId = 0;
  id = ++TransientService.nextId;
}

describe("InversifyContainer adapter", () => {
  test("supports bind/get compatibility", () => {
    const container = new InversifyContainer();
    container.bind("name").toConstantValue("ioc");

    expect(container.get("name")).toBe("ioc");
    expect(container.make("name")).toBe("ioc");
  });

  test("registers singleton class bindings", () => {
    const container = new InversifyContainer();
    container.singleton(SingletonService, SingletonService);

    const first = container.make(SingletonService);
    const second = container.make(SingletonService);

    expect(first).toBe(second);
  });

  test("registers transient class bindings", () => {
    const container = new InversifyContainer();
    container.transient(TransientService, TransientService);

    const first = container.make(TransientService);
    const second = container.make(TransientService);

    expect(first).not.toBe(second);
  });

  test("supports singleton and transient factory registrations", () => {
    const container = new InversifyContainer();
    container.instance("seed", 10);
    container.singleton("singleton.factory", (ioc) => ioc.make<number>("seed") + 1);
    container.transient("transient.factory", () => ({ marker: Math.random() }));

    expect(container.make("singleton.factory")).toBe(11);
    expect(container.make("singleton.factory")).toBe(11);
    expect(container.make<{ marker: number }>("transient.factory")).not.toBe(
      container.make("transient.factory"),
    );
  });

  test("supports instance registration and bound helpers", () => {
    const container = new InversifyContainer();
    container.instance("status", { ok: true });

    expect(container.bound("status")).toBe(true);
    expect(container.has("status")).toBe(true);
    expect(container.make<{ ok: boolean }>("status")).toEqual({ ok: true });
  });

  test("replaces previous binding when rebinding through helpers", () => {
    const container = new InversifyContainer();
    container.instance("value", 1);
    container.singleton("value", 2);
    expect(container.make("value")).toBe(2);

    container.transient("value", 3);
    expect(container.make("value")).toBe(3);
  });

  test("unbind removes a single binding and no-ops when missing", () => {
    const container = new InversifyContainer();
    container.instance("a", 1);
    container.unbind("a");
    expect(container.bound("a")).toBe(false);

    expect(() => container.unbind("a")).not.toThrow();
  });

  test("flush and unbindAll clear all bindings", () => {
    const container = new InversifyContainer();
    container.instance("a", 1);
    container.instance("b", 2);

    container.flush();
    expect(container.bound("a")).toBe(false);
    expect(container.bound("b")).toBe(false);

    container.instance("c", 3);
    container.unbindAll();
    expect(container.bound("c")).toBe(false);
  });

  test("exposes raw inversify container", () => {
    const container = new InversifyContainer();
    const raw = container.getRawContainer();
    raw.bind("x").toConstantValue(7);
    expect(container.make("x")).toBe(7);
  });
});
