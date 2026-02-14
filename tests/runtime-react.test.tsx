import { beforeAll, describe, expect, mock, test } from "bun:test";
import type { ContainerIdentifier } from "@/container/contract";
import InversifyContainer from "@/container/adapters/inversify";

const reactContextValues = new Map<object, unknown>();
let forcedReactContextValue: unknown = undefined;
const reactModule = {
  createContext<T>(defaultValue: T) {
    const context = {
      _default: defaultValue,
      Provider: ({ value, children }: { value: unknown; children?: unknown }) => {
        reactContextValues.set(context, value);
        return children ?? null;
      },
    };
    return context;
  },
  useContext<T>(context: { _default: T }) {
    if (typeof forcedReactContextValue !== "undefined") {
      return forcedReactContextValue as T;
    }
    if (reactContextValues.has(context as object)) {
      return reactContextValues.get(context as object) as T;
    }
    return context._default;
  },
  createElement(type: unknown, props?: Record<string, unknown>, ...children: unknown[]) {
    if (typeof type === "function") {
      return type({
        ...(props ?? {}),
        children:
          children.length === 0 ? undefined
          : children.length === 1 ? children[0]
          : children,
      });
    }
    return { type, props: { ...(props ?? {}), children } };
  },
};

mock.module("react", () => reactModule);
mock.module("react/jsx-runtime", () => ({
  Fragment: Symbol.for("react.fragment"),
  jsx: (type: unknown, props: Record<string, unknown>) =>
    reactModule.createElement(type, props),
  jsxs: (type: unknown, props: Record<string, unknown>) =>
    reactModule.createElement(type, props),
}));
mock.module("react/jsx-dev-runtime", () => ({
  Fragment: Symbol.for("react.fragment"),
  jsxDEV: (
    type: unknown,
    props: Record<string, unknown>,
  ) => reactModule.createElement(type, props),
}));

let ApplicationProvider: (props: { container: InversifyContainer; children?: unknown }) => unknown;
let useService: <T>(identifier: ContainerIdentifier<T>) => T;

describe("React runtime", () => {
  beforeAll(async () => {
    const runtime = await import("@/runtimes/react");
    ApplicationProvider = runtime.ApplicationProvider as (
      props: { container: InversifyContainer; children?: unknown },
    ) => unknown;
    useService = runtime.useService;
  });

  test("ApplicationProvider + useService resolves from container", () => {
    const container = new InversifyContainer();
    const token = Symbol("token");
    container.bind(token).toConstantValue("resolved");

    ApplicationProvider({ container, children: null });
    forcedReactContextValue = container;
    expect(useService<string>(token)).toBe("resolved");
    forcedReactContextValue = undefined;
  });

  test("useService throws when provider is missing", () => {
    forcedReactContextValue = undefined;
    reactContextValues.clear();
    expect(() => useService("missing")).toThrow(
      "Application container is not available in React context.",
    );
  });
});
