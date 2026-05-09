import type CacheManager from "../../cache/manager"
import { createFacade } from "./facade"

export const Cache = createFacade<CacheManager>("cache")

export default Cache
