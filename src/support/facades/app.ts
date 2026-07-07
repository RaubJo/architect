import type { Container } from "../../container/contract"
import { createFacade } from "./facade"

export const App = createFacade<Container>("app")

export default App
