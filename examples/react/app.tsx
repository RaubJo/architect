import { ReactNode, useState } from "react";
import { useProxy } from "valtio/utils";

import { Config  } from "@raubjo/architect/support/facades";
import { useService } from "@raubjo/architect/react";
import { ContainerIdentifier } from "@/index";

import CounterService from "./counter/service";
import Heartbeat from "./heartbeat/service";
import Menu from "./menu/service";

/**
 * Special hook to get a react-ready service class. 
 */
function useReactiveService<T>(service: ContainerIdentifier<T>): T
{
    return useProxy(useService<T>(service) as object) as T
}

export default function App() {

  const counter = useService<CounterService>(CounterService);
  const [value, setValue] = useState(counter.current());

  const heartbeat = useService<Heartbeat>(Heartbeat);

  /**
   * Wrap the service in a Valtio proxy which allows reactive access to class attributes.
   */
  const menus = useReactiveService<Menu>(Menu);

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
