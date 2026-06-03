import type { ReactElement } from "react"
import { createElement } from "react"
import ReactDOM from "react-dom/client"
import { ApplicationProvider } from "../../runtimes/react"
import type { Cleanup } from "../../support/service-provider"
import type Contract from "../contract"
import type { RendererContext } from "../contract"

type ReactRootComponent = () => ReactElement | null

export default class ReactRenderer implements Contract {
    render({ RootComponent, container, rootElementId }: RendererContext): Cleanup {
        const mountNode = document.getElementById(rootElementId)
        if (!mountNode) {
            throw new Error(`Missing mount node #${rootElementId}.`)
        }

        const root = ReactDOM.createRoot(mountNode)
        root.render(
            createElement(ApplicationProvider, { container }, createElement(RootComponent as ReactRootComponent)),
        )

        return () => root.unmount()
    }
}
