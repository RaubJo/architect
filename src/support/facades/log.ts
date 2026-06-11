import type LogManager from "../../log/manager"
import { createFacade } from "./facade"

export const Log = createFacade<LogManager>("log")

export default Log
