<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { Config } from "@raubjo/architect-core";
import { useService } from "@raubjo/architect-core/vue";
import CounterService from "./counter/service";
import HeartbeatService from "./heartbeat/service";

const counter = useService(CounterService);
const heartbeat = useService(HeartbeatService);
const value = ref(counter.current());
const ticks = ref(heartbeat.ticks());
const status = ref(heartbeat.status());

let syncId: number | null = null;

function increment() {
  counter.increment();
  value.value = counter.current();
}

function toggleHeartbeat() {
  heartbeat.toggle();
  status.value = heartbeat.status();
}

onMounted(() => {
  syncId = window.setInterval(() => {
    ticks.value = heartbeat.ticks();
    status.value = heartbeat.status();
  }, 200);
});

onUnmounted(() => {
  if (syncId !== null) {
    window.clearInterval(syncId);
  }
});
</script>

<template>
  <h1>{{ String(Config.get("app.name")) }}</h1>
  <h1>Heartbeat service: {{ ticks }} ({{ status }})</h1>
  <button @click="increment">Counter Service: {{ value }}</button>
  <button @click="toggleHeartbeat">Toggle Heartbeat</button>
</template>
