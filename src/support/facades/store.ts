import type StorageManager from "../../storage/manager"
import { createFacade } from "./facade"

export const Store = createFacade<StorageManager>("storage")

export default Store
