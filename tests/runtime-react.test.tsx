import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import InversifyContainer from "@/container/adapters/inversify";
import { ApplicationProvider, useService } from "@/runtimes/react";

describe("React runtime", () => {
  test("ApplicationProvider + useService resolves from container", () => {
    const container = new InversifyContainer();
    const token = Symbol("token");
    container.bind(token).toConstantValue("resolved");

    function Probe() {
      const value = useService<string>(token);
      return <div>{value}</div>;
    }

    const html = renderToString(
      <ApplicationProvider container={container}>
        <Probe />
      </ApplicationProvider>,
    );

    expect(html).toContain("resolved");
  });

  test("useService throws when provider is missing", () => {
    function Probe() {
      useService("missing");
      return null;
    }

    expect(() => renderToString(<Probe />)).toThrow(
      "Application container is not available in React context.",
    );
  });
});
