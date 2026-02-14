import type { ConfigItems } from "../config/repository";

export interface FileSystemAdapter {
    loadConfigItems(basePath: string): ConfigItems;
}

export class FileSystem {
    protected adapter: FileSystemAdapter;

    constructor(adapter: FileSystemAdapter) {
        this.adapter = adapter;
    }

    setAdapter(adapter: FileSystemAdapter): void {
        this.adapter = adapter;
    }

    loadConfigItems(basePath: string): ConfigItems {
        return this.adapter.loadConfigItems(basePath);
    }
}
