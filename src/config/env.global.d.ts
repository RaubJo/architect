declare global {
    function env(key: string): import("./env").EnvValue | undefined;
    function env<T>(key: string, defaultValue: T): import("./env").EnvValue | T;
}

export {};
