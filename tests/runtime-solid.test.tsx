import { describe, expect, test } from "bun:test";
import { createComponent } from "solid-js";
import { renderToString } from "solid-js/web/dist/server.js";
import InversifyContainer from "@/container/adapters/inversify";
import { ApplicationProvider, useService } from "@/runtimes/solid";

describe("Solid runtime", () => {
  test("ApplicationProvider + useService resolves from container", () => {
    const container = new InversifyContainer();
    const token = Symbol("token");
    container.bind(token).toConstantValue("resolved");

    function Probe() {
      const value = useService<string>(token);
      return value;
    }

    const html = renderToString(() =>
      createComponent(ApplicationProvider, {
        container,
        children: () => createComponent(Probe, {}),
      }),
    );

    expect(html).toContain("resolved");
  });

  test("useService throws when provider is missing", () => {
    function Probe() {
      useService("missing");
      return null;
    }

    expect(() => renderToString(() => createComponent(Probe, {}))).toThrow(
      "Application container is not available in Solid context.",
    );
  });
});
