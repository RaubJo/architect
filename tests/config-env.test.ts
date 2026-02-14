import { afterEach, describe, expect, test } from "bun:test";
import { env, registerGlobalEnv } from "@/config/env";
import { envTestingHelpers } from "@/config/env_test.helpers";

describe("env helper", () => {
  const originalProcess = (globalThis as { process?: unknown }).process;
  const originalGlobalEnv = (globalThis as { env?: unknown }).env;
  const originalImportMetaEnv = (
    globalThis as { __iocImportMetaEnvForTests?: unknown }
  ).__iocImportMetaEnvForTests;

  afterEach(() => {
    (globalThis as { process?: unknown }).process = originalProcess;
    (globalThis as { env?: unknown }).env = originalGlobalEnv;
    (
      globalThis as { __iocImportMetaEnvForTests?: unknown }
    ).__iocImportMetaEnvForTests = originalImportMetaEnv;
  });

  test("returns default when key does not exist", () => {
    (globalThis as { process?: { env: Record<string, unknown> } }).process = {
      env: {},
    };
    (
      globalThis as { __iocImportMetaEnvForTests?: unknown }
    ).__iocImportMetaEnvForTests = undefined;

    expect(env("MISSING", "fallback")).toBe("fallback");
  });

  test("returns default when process env is unavailable", () => {
    (
      globalThis as { __iocImportMetaEnvForTests?: unknown }
    ).__iocImportMetaEnvForTests = undefined;
    (globalThis as { process?: unknown }).process = undefined;

    expect(env("MISSING", "fallback")).toBe("fallback");
  });

  test("reads values from process env with laravel-like casts", () => {
    (
      globalThis as { __iocImportMetaEnvForTests?: unknown }
    ).__iocImportMetaEnvForTests = undefined;
    (globalThis as { process?: { env: Record<string, unknown> } }).process = {
      env: {
        BOOL_TRUE: "true",
        BOOL_FALSE: "(false)",
        NULL_VAL: "null",
        EMPTY_VAL: "(empty)",
        RAW: "abc",
        NUM: 123,
      },
    };

    expect(env("BOOL_TRUE")).toBe(true);
    expect(env("BOOL_FALSE")).toBe(false);
    expect(env("NULL_VAL", "x")).toBeNull();
    expect(env("EMPTY_VAL", "x")).toBe("");
    expect(env("RAW")).toBe("abc");
    expect(env("NUM")).toBe(123);
  });

  test("prefers import-meta env when key exists there", () => {
    (
      globalThis as { __iocImportMetaEnvForTests?: Record<string, unknown> }
    ).__iocImportMetaEnvForTests = {
      CACHE_STORE: "(true)",
    };
    (globalThis as { process?: { env: Record<string, unknown> } }).process = {
      env: {
        CACHE_STORE: "false",
      },
    };

    expect(env("CACHE_STORE")).toBe(true);
  });

  test("registers global env function without overriding existing one", () => {
    (globalThis as { env?: unknown }).env = undefined;
    registerGlobalEnv();
    expect(typeof (globalThis as { env?: unknown }).env).toBe("function");

    const custom = () => "custom";
    (globalThis as { env?: unknown }).env = custom;
    registerGlobalEnv();
    expect((globalThis as { env?: unknown }).env).toBe(custom);
  });

  test("exposes env helper internals", () => {
    expect(envTestingHelpers.normalizeEnvValue("(true)")).toBe(true);
    expect(envTestingHelpers.normalizeEnvValue("(false)")).toBe(false);
    expect(envTestingHelpers.normalizeEnvValue("(null)")).toBeNull();
    expect(envTestingHelpers.normalizeEnvValue("(empty)")).toBe("");
    expect(envTestingHelpers.normalizeEnvValue("raw")).toBe("raw");
    expect(envTestingHelpers.normalizeEnvValue(123)).toBe(123);

    (
      globalThis as { __iocImportMetaEnvForTests?: Record<string, unknown> }
    ).__iocImportMetaEnvForTests = { TEST: "1" };
    expect(envTestingHelpers.resolveImportMetaEnv()).toEqual({ TEST: "1" });

    (
      globalThis as { __iocImportMetaEnvForTests?: unknown }
    ).__iocImportMetaEnvForTests = undefined;
    expect(typeof envTestingHelpers.resolveImportMetaEnv()).toBe("object");

    (globalThis as { process?: unknown }).process = undefined;
    expect(envTestingHelpers.resolveProcessEnv()).toEqual({});

    (globalThis as { process?: { env: Record<string, unknown> } }).process = {
      env: { APP_ENV: "local" },
    };
    expect(envTestingHelpers.resolveProcessEnv()).toEqual({ APP_ENV: "local" });
  });
});
