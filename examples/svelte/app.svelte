<script lang="ts">
  import { onDestroy } from "svelte";
  import { Config } from "@raubjo/architect-core";
  import { provideContainer, useService } from "@raubjo/architect-core/svelte";
  import CounterService from "./counter/service";
  import HeartbeatService from "./heartbeat/service";

  export let container: unknown;

  provideContainer(container as never);
  const counter = useService(CounterService);
  const heartbeat = useService(HeartbeatService);
  let value = counter.current();
  let ticks = heartbeat.ticks();
  let status = heartbeat.status();

  const syncId = window.setInterval(() => {
    ticks = heartbeat.ticks();
    status = heartbeat.status();
  }, 200);

  function increment() {
    counter.increment();
    value = counter.current();
  }

  function toggle() {
    heartbeat.toggle();
    status = heartbeat.status();
  }

  onDestroy(() => {
    window.clearInterval(syncId);
  });
</script>

<h1>{String(Config.get("app.name"))}</h1>
<h1>Heartbeat service: {ticks} ({status})</h1>
<button onclick={increment}>Counter Service: {value}</button>
<button onclick={toggle}>Toggle Heartbeat</button>
