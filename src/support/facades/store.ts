import type StoreManager from "../../store/manager"
import { createFacade } from "./facade"

export const Store = createFacade<StoreManager>("store")

export default Store
