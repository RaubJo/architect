import { ReactNode, useState } from "react";

import { Config  } from "@raubjo/architect-core";
import { useService } from "@raubjo/architect-core/react";

import CounterService from "./counter/service";
import Heartbeat from "./heartbeat/service";

export default function App() {
  const counter = useService<CounterService>(CounterService);
  const [value, setValue] = useState(counter.current());

  const heartbeat = useService<Heartbeat>(Heartbeat);

  function increment() {
    counter.increment();
    setValue(counter.current());
  }

  return (
    <>
    <h1>{Config.get<string>('app.name') as ReactNode}</h1>
    <h1>Heartbeat service: {heartbeat.ticks()}</h1>
    <button onClick={increment}>Counter Service: {value}</button>
    </>
  );
}
