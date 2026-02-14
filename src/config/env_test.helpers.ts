import type { EnvValue } from "./env";

type EnvMap = Record<string, EnvValue | undefined>;

function normalizeEnvValue(value: EnvValue | undefined): EnvValue | undefined {
    if (typeof value !== "string") {
        return value;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "(true)") {
        return true;
    }

    if (normalized === "false" || normalized === "(false)") {
        return false;
    }

    if (normalized === "null" || normalized === "(null)") {
        return null;
    }

    if (normalized === "empty" || normalized === "(empty)") {
        return "";
    }

    return value;
}

function resolveProcessEnv(): EnvMap {
    const processValue = (globalThis as { process?: { env?: EnvMap } }).process;

    if (!processValue?.env) {
        return {};
    }

    return processValue.env;
}

function resolveImportMetaEnv(): EnvMap {
    const testEnv = (
        globalThis as {
            __iocImportMetaEnvForTests?: EnvMap;
        }
    ).__iocImportMetaEnvForTests;
    if (testEnv) {
        return testEnv;
    }

    const meta = import.meta as ImportMeta & { env?: EnvMap };
    return meta.env ?? {};
}

export const envTestingHelpers = {
    normalizeEnvValue,
    resolveImportMetaEnv,
    resolveProcessEnv,
};
