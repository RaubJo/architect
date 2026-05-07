import type { EnvValue } from "./env";

type EnvMap = Record<string, EnvValue | undefined>;
const normalizedEnvValues: Record<string, EnvValue> = {
    "(empty)": "",
    "(false)": false,
    "(null)": null,
    "(true)": true,
    empty: "",
    false: false,
    null: null,
    true: true,
};

function normalizeEnvValue(value: EnvValue | undefined): EnvValue | undefined {
    if (typeof value !== "string") {
        return value;
    }

    const normalized = value.trim().toLowerCase();
    return normalized in normalizedEnvValues ?
            normalizedEnvValues[normalized]
        :   value;
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
