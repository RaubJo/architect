import type StorageManager from "../../storage/manager";
import { createFacade } from "./facade";

export const Storage = createFacade<StorageManager>("storage");

export default Storage;
