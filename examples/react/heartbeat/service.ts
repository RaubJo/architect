import { type Cleanup } from "@raubjo/architect-core";
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

type State = {
  ticks: number;
  status: "running" | "stopped";
};

export default class Heartbeat {
  protected intervalId: number | null;
  protected store;

  constructor() {
    this.intervalId = null;
    
    this.store = createStore<State>(() => ({
      ticks: 0,
      status: "stopped",
    }));
  }

  public useStore<T>(selector: (state: State) => T): T {
    return useStore(this.store, selector);
  }

  public ticks(): number {
    return this.useStore((state) => state.ticks);
  }

  public status(): State["status"] {
    return this.useStore((state) => state.status);
  }

  public start(): Cleanup 
  {
    if (this.intervalId) {
      return () => this.stop();
    }

    this.store.setState({ status: "running" });
    this.intervalId = window.setInterval(() => {
      this.store.setState((state) => ({ ticks: state.ticks + 1 }));
    }, 1000);

    return () => this.stop();
  }

  public stop()
  {
    if (!this.intervalId) {
      return;
    }

    window.clearInterval(this.intervalId);
    this.intervalId = null;
    this.store.setState({ status: "stopped" });
  }

  public toggle(): void
  {
    if (this.store.getState().status === 'running') {
        this.stop()
        return
    }

    this.start()
  }
}
