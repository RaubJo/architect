import { beforeAll, describe, expect, mock, test } from "bun:test";
import type { ContainerIdentifier } from "@/container/contract";
import InversifyContainer from "@/container/adapters/inversify";

const vueState = {
  injectedContainer: null as InversifyContainer | null,
  provided: null as { key: unknown; value: unknown } | null,
  mountedTarget: null as unknown,
  mountedComponent: null as unknown,
  unmounted: 0,
};

mock.module("vue", () => ({
  inject: (_key: unknown, defaultValue: unknown) =>
    vueState.injectedContainer ?? defaultValue,
  createApp: (component: unknown) => {
    vueState.mountedComponent = component;
    return {
      provide: (key: unknown, value: unknown) => {
        vueState.provided = { key, value };
      },
      mount: (target: unknown) => {
        vueState.mountedTarget = target;
      },
      unmount: () => {
        vueState.unmounted += 1;
      },
    };
  },
}));

let useService: <T>(identifier: ContainerIdentifier<T>) => T;
let containerKey: symbol;
let VueRenderer: new () => {
  render: (context: {
    RootComponent: unknown;
    container: InversifyContainer;
    rootElementId: string;
  }) => () => void;
};

beforeAll(async () => {
  const runtime = await import("@/runtimes/vue");
  useService = runtime.useService;
  containerKey = runtime.containerKey;

  const renderer = await import("@/renderers/adapters/vue");
  VueRenderer = renderer.default;
});

describe("Vue runtime and renderer", () => {
  test("useService resolves from injected container", () => {
    const container = new InversifyContainer();
    const token = Symbol("token");
    container.bind(token).toConstantValue("resolved");
    vueState.injectedContainer = container;

    expect(useService<string>(token)).toBe("resolved");
  });

  test("useService throws when container is missing", () => {
    vueState.injectedContainer = null;

    expect(() => useService("missing")).toThrow(
      "Application container is not available in Vue context.",
    );
  });

  test("renderer throws when mount node is missing", () => {
    (globalThis as { document: { getElementById: (id: string) => null } }).document = {
      getElementById: () => null,
    };

    const renderer = new VueRenderer();
    expect(() =>
      renderer.render({
        RootComponent: {},
        container: new InversifyContainer(),
        rootElementId: "root",
      }),
    ).toThrow("Missing mount node #root.");
  });

  test("renderer provides container, mounts, and unmounts", () => {
    const mountNode = {};
    vueState.provided = null;
    vueState.mountedTarget = null;
    vueState.mountedComponent = null;
    vueState.unmounted = 0;

    (globalThis as { document: { getElementById: (id: string) => object | null } }).document = {
      getElementById: () => mountNode,
    };

    const RootComponent = { name: "RootComponent" };
    const container = new InversifyContainer();
    const renderer = new VueRenderer();

    const cleanup = renderer.render({
      RootComponent,
      container,
      rootElementId: "root",
    });

    expect(vueState.mountedComponent).toBe(RootComponent);
    expect(vueState.mountedTarget).toBe(mountNode);
    expect(vueState.provided).toEqual({ key: containerKey, value: container });

    cleanup();
    expect(vueState.unmounted).toBe(1);
  });
});
