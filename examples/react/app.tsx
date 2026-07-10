import { ReactNode, useState } from "react";

import { Config  } from "@raubjo/architect/support/facades";
import { useService } from "@raubjo/architect/react";

import CounterService from "./counter/service";
import Heartbeat from "./heartbeat/service";
import Menu from "./menu/service";

export default function App() {

  const counter = useService<CounterService>(CounterService);
  const [value, setValue] = useState(counter.current());

  const heartbeat = useService<Heartbeat>(Heartbeat);

  /**
   * Menu is tagged "reactive" in its provider, so useService transparently
   * wires up Valtio-backed re-rendering — same call as any other service.
   */
  const menus = useService<Menu>(Menu);

  /**
   * Mutate and then read the value as a form of updating UI state.
   */
  function increment() {
    counter.increment();
    setValue(counter.current());
  }

  return (
    <>
    {/* Get config from the container. */}
    <h1>{Config.get('app.name') as ReactNode}</h1> 

    {/* Get state that is being mutated outside of this component. */}
    <h1>Heartbeat service: {heartbeat.ticks()}</h1>

    {/* Get state mutated by this component.  */}
    <button onClick={increment}>Counter Service: {value}</button>

    {/* Use Valtio to create a reactive class. */}
    <button onClick={() => menus.main.toggle()}>Main menu: {menus.main.isOpen() ? "open" : "closed"}</button>
    <button onClick={() => menus.sidebar.toggle()}>Sidebar: {menus.sidebar.isOpen() ? "open" : "closed"}</button>
    </>
  );
}
