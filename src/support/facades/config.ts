import type ConfigRepository from "../../config/repository"
import { createFacade } from "./facade"

export const Config = createFacade<ConfigRepository>("config")

export default Config
