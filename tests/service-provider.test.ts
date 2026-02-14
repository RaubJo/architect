import { describe, expect, test } from "bun:test";
import ServiceProvider, {
  DeferrableServiceProvider,
} from "@/support/service-provider";
import InversifyContainer from "@/container/adapters/inversify";

describe("ServiceProvider base classes", () => {
  test("default register and boot are no-ops", () => {
    const provider = new ServiceProvider();
    const container = new InversifyContainer();

    expect(provider.register({ container })).toBeUndefined();
    expect(provider.boot({ container })).toBeUndefined();
  });

  test("deferrable provider default provides list is empty", () => {
    const provider = new DeferrableServiceProvider();
    const container = new InversifyContainer();
    expect(provider.register({ container })).toBeUndefined();
    expect(provider.boot({ container })).toBeUndefined();
    expect(provider.provides()).toEqual([]);
  });
});
