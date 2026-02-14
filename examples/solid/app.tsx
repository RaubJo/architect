import { createSignal, onCleanup } from "solid-js";
import { Config } from "@raubjo/architect-core";
import { useService } from "@raubjo/architect-core/solid";
import CounterService from "./counter/service";
import HeartbeatService from "./heartbeat/service";

export default function App() {
  const counter = useService(CounterService);
  const [value, setValue] = createSignal(counter.current());
  const heartbeat = useService(HeartbeatService);
  const [ticks, setTicks] = createSignal(heartbeat.ticks());
  const [status, setStatus] = createSignal(heartbeat.status());

  const unsubscribe = heartbeat.subscribe((state) => {
    setTicks(state.ticks);
    setStatus(state.status);
  });

  onCleanup(() => {
    unsubscribe();
  });

  return (
    <>
      <h1>{String(Config.get("app.name"))}</h1>
      <h1>Heartbeat service: {ticks()} ({status()})</h1>
      <button
        onClick={() => {
          counter.increment();
          setValue(counter.current());
        }}
      >
        Counter Service: {value()}
      </button>
      <button onClick={() => heartbeat.toggle()}>Toggle Heartbeat</button>
    </>
  );
}
