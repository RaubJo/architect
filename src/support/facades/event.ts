import type { Bus } from "../../events/bus"
import { createFacade } from "./facade"

export const Event = createFacade<Bus>("events")

export default Event
