import MemoryStorageAdapter from "@/storage/adapters/memory";
import type { Adapter } from "@/storage/adapters/contract";

type OpenFactory = Pick<IDBFactory, "open">;

export default class IndexedDbAdapter implements Adapter {
    protected fallback: Adapter;
    protected name: string;
    protected factory: OpenFactory | null;
    protected dbPromise: Promise<IDBDatabase> | null;

    constructor(
        options: {
            factory?: OpenFactory | null;
            name?: string;
            fallback?: Adapter;
        } = {},
    ) {
        this.factory = options.factory ?? globalThis.indexedDB ?? null;
        this.name = options.name ?? "ioc-storage";
        this.fallback = options.fallback ?? new MemoryStorageAdapter();
        this.dbPromise = null;
    }

    protected req<T>(request: IDBRequest<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () =>
                reject(request.error ?? new Error("IndexedDB request failed."));
        });
    }

    protected openDb(): Promise<IDBDatabase> {
        if (this.dbPromise) {
            return this.dbPromise;
        }

        if (!this.factory) {
            return Promise.reject(new Error("IndexedDB is not available."));
        }

        this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
            const request = this.factory?.open(this.name, 1);
            if (!request) {
                reject(
                    new Error("IndexedDB open request could not be created."),
                );
                return;
            }

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains("kv")) {
                    db.createObjectStore("kv");
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () =>
                reject(
                    request.error ??
                        new Error("IndexedDB database could not be opened."),
                );
        });

        return this.dbPromise;
    }

    protected async withStore<T>(
        mode: IDBTransactionMode,
        action: (store: IDBObjectStore) => Promise<T>,
    ): Promise<T> {
        try {
            const db = await this.openDb();
            const tx = db.transaction("kv", mode);
            const store = tx.objectStore("kv");
            return await action(store);
        } catch (_error) {
            return actionFallback(this.fallback, mode, action);
        }
    }

    async get<T = unknown>(key: string): Promise<T | null> {
        return this.withStore("readonly", async (store) => {
            const value = await this.req<unknown>(store.get(key));
            return value === undefined ? null : (value as T);
        });
    }

    async set<T = unknown>(key: string, value: T): Promise<void> {
        await this.withStore("readwrite", async (store) => {
            await this.req(store.put(value, key));
            return undefined;
        });
    }

    async has(key: string): Promise<boolean> {
        return this.withStore("readonly", async (store) => {
            const count = await this.req<number>(store.count(key));
            return count > 0;
        });
    }

    async delete(key: string): Promise<void> {
        await this.withStore("readwrite", async (store) => {
            await this.req(store.delete(key));
            return undefined;
        });
    }

    async clear(): Promise<void> {
        await this.withStore("readwrite", async (store) => {
            await this.req(store.clear());
            return undefined;
        });
    }

    async keys(): Promise<string[]> {
        return this.withStore("readonly", async (store) => {
            const keys = await this.req<Array<IDBValidKey>>(store.getAllKeys());
            const normalized: string[] = [];
            for (const key of keys) {
                normalized.push(String(key));
            }

            return normalized;
        });
    }
}

async function actionFallback<T>(
    fallback: Adapter,
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
    // Keep call sites small: map IDB actions to the same short storage contract.
    if (mode === "readonly") {
        const store = createReadonlyProxy(fallback);
        return action(store as unknown as IDBObjectStore);
    }

    const store = createReadWriteProxy(fallback);
    return action(store as unknown as IDBObjectStore);
}

function createReadonlyProxy(fallback: Adapter): Partial<IDBObjectStore> {
    return {
        get: (key: IDBValidKey) =>
            wrapPromiseRequest(fallback.get(String(key))),
        count: (key?: IDBValidKey | IDBKeyRange) =>
            wrapPromiseRequest(
                fallback
                    .has(String(key as IDBValidKey))
                    .then((exists) => (exists ? 1 : 0)),
            ),
        getAllKeys: () =>
            wrapPromiseRequest(
                fallback.keys().then((keys) => keys as Array<IDBValidKey>),
            ),
    };
}

function createReadWriteProxy(fallback: Adapter): Partial<IDBObjectStore> {
    return {
        ...createReadonlyProxy(fallback),
        put: (value: unknown, key?: IDBValidKey) =>
            wrapPromiseRequest(fallback.set(String(key as IDBValidKey), value)),
        delete: (key: IDBValidKey | IDBKeyRange) =>
            wrapPromiseRequest(fallback.delete(String(key as IDBValidKey))),
        clear: () => wrapPromiseRequest(fallback.clear()),
    };
}

function wrapPromiseRequest<T>(promise: Promise<T>): IDBRequest<T> {
    const request: Partial<IDBRequest<T>> = {
        onsuccess: null,
        onerror: null,
    };

    promise.then(
        (result) => {
            request.result = result;
            request.onsuccess?.call(
                request as IDBRequest<T>,
                new Event("success"),
            );
        },
        (error) => {
            request.error = error as DOMException;
            request.onerror?.call(request as IDBRequest<T>, new Event("error"));
        },
    );

    return request as IDBRequest<T>;
}
