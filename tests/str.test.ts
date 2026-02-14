import { afterEach, describe, expect, test } from "bun:test";
import Str, { registerGlobalStr } from "@/support/str";
import { strTestingHelpers } from "@/support/str_test.helpers";

describe("Str helper", () => {
  const originalGlobalStr = (globalThis as { Str?: unknown }).Str;

  afterEach(() => {
    (globalThis as { Str?: unknown }).Str = originalGlobalStr;
  });

  test("changes string case and length", () => {
    expect(new (Str as unknown as { new (): object })()).toBeTruthy();
    expect(Str.lower("TeSt")).toBe("test");
    expect(Str.upper("TeSt")).toBe("TEST");
    expect(Str.length("abc")).toBe(3);
  });

  test("checks contains and boundaries", () => {
    expect(Str.contains("Hello World", "World")).toBe(true);
    expect(Str.contains("Hello World", "world")).toBe(false);
    expect(Str.contains("Hello World", "world", true)).toBe(true);
    expect(Str.contains("Hello World", ["x", "y"])).toBe(false);

    expect(Str.startsWith("framework", "frame")).toBe(true);
    expect(Str.startsWith("framework", ["zzz", "fra"])).toBe(true);
    expect(Str.startsWith("framework", "zzz")).toBe(false);

    expect(Str.endsWith("framework", "work")).toBe(true);
    expect(Str.endsWith("framework", ["abc", "work"])).toBe(true);
    expect(Str.endsWith("framework", "abc")).toBe(false);
  });

  test("replaces content", () => {
    expect(Str.replace("laravel", "ioc", "laravel-app")).toBe("ioc-app");
    expect(Str.replace(/-app$/, "", "laravel-app")).toBe("laravel");
  });

  test("converts string casing styles", () => {
    expect(Str.snake("HelloWorld")).toBe("hello_world");
    expect(Str.snake("hello-world", ".")).toBe("hello.world");
    expect(Str.kebab("HelloWorld")).toBe("hello-world");
    expect(Str.studly("hello_world-test")).toBe("HelloWorldTest");
    expect(Str.camel("hello_world-test")).toBe("helloWorldTest");
    expect(Str.camel("")).toBe("");
  });

  test("creates slugs", () => {
    expect(Str.slug("Héllo, Wörld!")).toBe("hello-world");
    expect(Str.slug("Héllo, Wörld!", "_")).toBe("hello_world");
  });

  test("registers global Str without overriding existing value", () => {
    (globalThis as { Str?: unknown }).Str = undefined;
    registerGlobalStr();
    expect((globalThis as { Str?: unknown }).Str).toBe(Str);

    const custom = class Custom {};
    (globalThis as { Str?: unknown }).Str = custom;
    registerGlobalStr();
    expect((globalThis as { Str?: unknown }).Str).toBe(custom);
  });

  test("exposes helper internals", () => {
    expect(strTestingHelpers.splitWords("HelloWorld_test-value")).toEqual([
      "Hello",
      "World",
      "test",
      "value",
    ]);
    expect(strTestingHelpers.splitWords("")).toEqual([]);
    expect(strTestingHelpers.normalizeForSlug("Héllo Wörld")).toBe("hello-world");
  });
});
