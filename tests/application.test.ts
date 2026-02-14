import { afterEach, describe, expect, mock, test } from "bun:test";
import ConfigRepository from "@/config/repository";
import InversifyContainer from "@/container/adapters/inversify";
import BuiltinContainer from "@/container/adapters/builtin";
import { Application } from "@/foundation/application";
import { applicationTestingHelpers } from "@/foundation/application_test.helpers";
import ServiceProvider from "@/support/service-provider";

const reactContextValues = new Map<object, unknown>();
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

const reactDomState = {
  rendered: 0,
  unmounted: 0,
  mountNode: undefined as unknown,
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
mock.module("react-dom/client", () => ({
  default: {
    createRoot: (node: unknown) => {
      reactDomState.mountNode = node;
      return {
        render: () => {
          reactDomState.rendered += 1;
        },
        unmount: () => {
          reactDomState.unmounted += 1;
        },
      };
    },
  },
}));

describe("Application", () => {
  afterEach(() => {
    (globalThis as { window?: unknown; document?: unknown }).window = undefined;
    (globalThis as { window?: unknown; document?: unknown }).document = undefined;
    (
      globalThis as { __iocConfigGlobForTests?: unknown }
    ).__iocConfigGlobForTests = undefined;
    (
      globalThis as { __iocPackageJsonForTests?: unknown }
    ).__iocPackageJsonForTests = undefined;
    (
      globalThis as { __iocPackageJsonGlobForTests?: unknown }
    ).__iocPackageJsonGlobForTests = undefined;
    (
      globalThis as { __iocContainerFactoryRegistry?: unknown }
    ).__iocContainerFactoryRegistry = undefined;
    Application.clearConfigCache();
  });

  test("make throws when container is not initialized", () => {
    expect(() => Application.make("config")).toThrow(
      "Application container is not available. Call run() first.",
    );
  });

  test("run with custom renderer executes lifecycle and cleanup in reverse order", () => {
    const calls: string[] = [];
    let beforeUnload: (() => void) | undefined;

    (globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } })
      .window = {
      addEventListener: (_event, cb) => {
        beforeUnload = cb;
      },
    };

    class DemoProvider extends ServiceProvider {
      register({ container }: { container: { bind: (id: string) => { toConstantValue: (v: unknown) => void } } }) {
        calls.push("provider.register");
        container.bind("demo").toConstantValue("value");
        return () => calls.push("provider.register.cleanup");
      }

      boot() {
        calls.push("provider.boot");
        return () => calls.push("provider.boot.cleanup");
      }
    }

    const app = Application.configure("./")
      .withProviders([new DemoProvider()])
      .withServices(({ container }) => {
        calls.push("services");
        container.bind("services.value").toConstantValue(1);
        return () => calls.push("services.cleanup");
      })
      .withStartup(() => {
        calls.push("startup");
        return () => calls.push("startup.cleanup");
      })
      .withRoot(() => null)
      .withRenderer({
        render: () => {
          calls.push("renderer");
          return () => calls.push("renderer.cleanup");
        },
      });

    const running = app.run();
    expect(Application.make("demo")).toBe("value");
    expect(Application.make("storage")).toBeTruthy();
    expect(Application.make("cache")).toBeTruthy();
    expect(running.container.get("services.value")).toBe(1);
    expect(calls).toEqual([
      "provider.register",
      "services",
      "provider.boot",
      "startup",
      "renderer",
    ]);

    expect(typeof beforeUnload).toBe("function");
    beforeUnload?.();

    expect(calls).toEqual([
      "provider.register",
      "services",
      "provider.boot",
      "startup",
      "renderer",
      "renderer.cleanup",
      "startup.cleanup",
      "provider.boot.cleanup",
      "services.cleanup",
      "provider.register.cleanup",
    ]);

    expect(() => Application.make("demo")).toThrow(
      "Application container is not available. Call run() first.",
    );
  });

  test("exposes helper behavior used for config discovery", () => {
    expect(applicationTestingHelpers.fileNameWithoutExtension("/src/config/app.ts")).toBe("app");
    expect(applicationTestingHelpers.normalizeBasePath("./")).toBe("");
    expect(applicationTestingHelpers.normalizeBasePath("./src")).toBe("src");
    expect(applicationTestingHelpers.isPathInConfigDirectories("/src/config/app.ts", "./")).toBe(
      true,
    );
    expect(
      applicationTestingHelpers.isPathInConfigDirectories(
        "/workspace/src/config/app.ts",
        "/workspace",
      ),
    ).toBe(true);
  });

  test("does not load config modules implicitly", () => {
    (
      globalThis as {
        __iocConfigGlobForTests?: (
          pattern: string | string[],
          options?: { eager?: boolean },
        ) => Record<string, unknown>;
      }
    ).__iocConfigGlobForTests = () => ({
      "/src/config/app.ts": { default: { name: "From App Config" } },
      "/src/config/cache.ts": { default: { store: "memory" } },
      "/other/path/ignored.ts": { default: { nope: true } },
    });

    (globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } })
      .window = {
      addEventListener: () => {},
    };

    const first = Application.configure({
      basePath: "./src",
      config: {
        cache: { store: "memory" },
      },
    }).run();
    const second = Application.configure({
      basePath: "./src",
      config: {
        cache: { store: "memory" },
      },
    }).run();

    const firstConfig = first.container.get(ConfigRepository);
    const secondConfig = second.container.get(ConfigRepository);

    expect(firstConfig.get("app")).toBeNull();
    expect(firstConfig.get("cache")).toEqual({ store: "memory" });
    expect(firstConfig.get("ignored")).toBeNull();
    expect(firstConfig.all()).toEqual(secondConfig.all());
    expect(firstConfig.all()).not.toBe(secondConfig.all());

    // Config passed to configure should be cloned into each app instance.
    firstConfig.set("cache.store", "updated");
    expect(secondConfig.get("cache.store")).toBe("memory");

    first.stop();
    second.stop();
  });

  test("configure supports explicit config object overrides", () => {
    (globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } })
      .window = { addEventListener: () => {} };

    const running = Application.configure({
      basePath: "./",
      config: {
        app: { name: "From configure()", timezone: "UTC" },
      },
    }).run();

    const config = running.container.get(ConfigRepository);
    expect(config.get("app.name")).toBe("From configure()");
  });

  test("configure options are merged with defaults", () => {
    expect(applicationTestingHelpers.mergeConfigureOptions()).toEqual({
      basePath: "./",
      container: { adapter: "auto", factory: null },
      config: {},
    });

    expect(
      applicationTestingHelpers.mergeConfigureOptions({
        basePath: "./src",
        container: { adapter: "builtin" },
      }),
    ).toEqual({
      basePath: "./src",
      container: { adapter: "builtin", factory: null },
      config: {},
    });
  });

  test("reads package.json candidates from test glob loader", () => {
    (
      globalThis as {
        __iocPackageJsonGlobForTests?: (
          pattern: string | string[],
          options?: { eager?: boolean },
        ) => Record<string, unknown>;
      }
    ).__iocPackageJsonGlobForTests = () => ({
      "/package.json": { default: { dependencies: { inversify: "^7.0.0" } } },
      "/package.raw.json": { dependencies: { react: "^19.0.0" } },
    });

    expect(applicationTestingHelpers.readPackageJsonCandidates()).toEqual([
      { dependencies: { inversify: "^7.0.0" } },
      { dependencies: { react: "^19.0.0" } },
    ]);
  });

  test("reads package.json candidates from test callback", () => {
    (
      globalThis as {
        __iocPackageJsonForTests?: () => { dependencies?: Record<string, string> };
      }
    ).__iocPackageJsonForTests = () => ({ dependencies: { inversify: "^7.0.0" } });

    expect(applicationTestingHelpers.readPackageJsonCandidates()).toEqual([
      { dependencies: { inversify: "^7.0.0" } },
    ]);
  });

  test("reads package.json candidates from test array values", () => {
    (
      globalThis as {
        __iocPackageJsonForTests?:
          | { dependencies?: Record<string, string> }[]
          | (() => { dependencies?: Record<string, string> }[]);
      }
    ).__iocPackageJsonForTests = [
      { dependencies: { inversify: "^7.0.0" } },
      { dependencies: { react: "^19.0.0" } },
    ];
    expect(applicationTestingHelpers.readPackageJsonCandidates()).toEqual([
      { dependencies: { inversify: "^7.0.0" } },
      { dependencies: { react: "^19.0.0" } },
    ]);

    (
      globalThis as {
        __iocPackageJsonForTests?: () => { dependencies?: Record<string, string> }[];
      }
    ).__iocPackageJsonForTests = () => [{ dependencies: { vue: "^3.0.0" } }];
    expect(applicationTestingHelpers.readPackageJsonCandidates()).toEqual([
      { dependencies: { vue: "^3.0.0" } },
    ]);
  });

  test("auto container uses builtin when inversify is not listed", () => {
    (
      globalThis as {
        __iocPackageJsonForTests?: { dependencies?: Record<string, string> };
      }
    ).__iocPackageJsonForTests = {
      dependencies: {},
    };
    (globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } })
      .window = { addEventListener: () => {} };

    const running = Application.configure({ basePath: "./", container: { adapter: "auto" } }).run();
    expect(running.container).toBeInstanceOf(BuiltinContainer);
  });

  test("auto container uses inversify when package.json includes inversify", () => {
    (
      globalThis as {
        __iocPackageJsonForTests?: { dependencies?: Record<string, string> };
      }
    ).__iocPackageJsonForTests = {
      dependencies: { inversify: "^7.0.0" },
    };
    (
      globalThis as {
        __iocContainerFactoryRegistry?: { inversify?: () => unknown };
      }
    ).__iocContainerFactoryRegistry = {
      inversify: () => new InversifyContainer(),
    };
    (globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } })
      .window = { addEventListener: () => {} };

    const running = Application.configure({ basePath: "./", container: { adapter: "auto" } }).run();
    expect(running.container).toBeInstanceOf(InversifyContainer);
  });

  test("auto container falls back to builtin when inversify is detected but factory is missing", () => {
    (
      globalThis as {
        __iocPackageJsonForTests?: { dependencies?: Record<string, string> };
      }
    ).__iocPackageJsonForTests = {
      dependencies: { inversify: "^7.0.0" },
    };
    (globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } })
      .window = { addEventListener: () => {} };

    const running = Application.configure({ basePath: "./", container: { adapter: "auto" } }).run();
    expect(running.container).toBeInstanceOf(BuiltinContainer);
  });

  test("configure can force builtin, inversify, or custom factory", () => {
    (globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } })
      .window = { addEventListener: () => {} };
    (
      globalThis as {
        __iocContainerFactoryRegistry?: { inversify?: () => unknown };
      }
    ).__iocContainerFactoryRegistry = {
      inversify: () => new InversifyContainer(),
    };

    const builtin = Application.configure({
      basePath: "./",
      container: { adapter: "builtin" },
    }).run();
    expect(builtin.container).toBeInstanceOf(BuiltinContainer);

    const inversify = Application.configure({
      basePath: "./",
      container: { adapter: "inversify" },
    }).run();
    expect(inversify.container).toBeInstanceOf(InversifyContainer);

    const custom = Application.configure({
      basePath: "./",
      container: { factory: () => new BuiltinContainer() },
    }).run();
    expect(custom.container).toBeInstanceOf(BuiltinContainer);
  });

  test("explicit inversify adapter throws when no factory is registered", () => {
    (globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } })
      .window = { addEventListener: () => {} };

    expect(() =>
      Application.configure({
        basePath: "./",
        container: { adapter: "inversify" },
      }).run(),
    ).toThrow(
      "Inversify adapter is not registered. Provide container.factory or register __iocContainerFactoryRegistry.inversify.",
    );
  });

  test("renderer requires root component", () => {
    (globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } })
      .window = {
      addEventListener: () => {},
    };

    const app = Application.configure("./").withRenderer({ render: () => () => {} });

    expect(() => app.run()).toThrow(
      "Root component is required when using a custom renderer.",
    );
  });

  test("react renderer throws if mount node is missing", async () => {
    const { default: ReactRenderer } = await import("@/renderers/adapters/react");

    (globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } })
      .window = {
      addEventListener: () => {},
    };
    (globalThis as { document: { getElementById: (id: string) => null } }).document = {
      getElementById: () => null,
    };

    const app = Application.configure("./")
      .withRoot(() => null)
      .withRenderer(new ReactRenderer());

    expect(() => app.run()).toThrow("Missing mount node #root.");
  });

  test("react renderer mounts and unmounts when stopped", async () => {
    const { default: ReactRenderer } = await import("@/renderers/adapters/react");

    let beforeUnload: (() => void) | undefined;

    (globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } })
      .window = {
      addEventListener: (_event, cb) => {
        beforeUnload = cb;
      },
    };
    (globalThis as { document: { getElementById: (id: string) => object | null } }).document = {
      getElementById: () => ({}),
    };

    reactDomState.rendered = 0;
    reactDomState.unmounted = 0;
    reactDomState.mountNode = undefined;

    const running = Application.configure("./")
      .withRoot(() => null)
      .withRenderer(new ReactRenderer())
      .run();
    expect(reactDomState.rendered).toBe(1);
    expect(reactDomState.mountNode).toBeTruthy();
    running.stop();
    expect(reactDomState.unmounted).toBe(1);
    // Stop twice should still be safe if beforeunload callback also runs.
    beforeUnload?.();
    expect(reactDomState.unmounted).toBe(2);
  });

  test("uses fallback no-op renderer cleanup when custom renderer returns nothing", () => {
    (globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } })
      .window = {
      addEventListener: (_event, cb) => {
        cb();
      },
    };

    const app = Application.configure("./")
      .withRoot(() => null)
      .withRenderer({ render: () => undefined });

    expect(() => app.run()).not.toThrow();
  });

  test("requires explicit renderer when root component is set", () => {
    (globalThis as { window: { addEventListener: (event: string, cb: () => void) => void } })
      .window = {
      addEventListener: () => {},
    };

    const app = Application.configure("./").withRoot(() => null);

    expect(() => app.run()).toThrow(
      "Renderer is required when root component is set. Install a renderer feature (react/solid/svelte/vue) and call withRenderer(...).",
    );
  });
});
