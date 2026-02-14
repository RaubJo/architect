import { type Cleanup } from "@raubjo/architect-core";
import { createStore, type StoreApi } from "zustand/vanilla";

type State = {
  ticks: number;
  status: "running" | "stopped";
};

export default class Heartbeat {
  protected intervalId: number | null;
  protected store: StoreApi<State>;

  constructor() {
    this.intervalId = null;
    
    this.store = createStore<State>(() => ({
      ticks: 0,
      status: "stopped",
    }));
  }

  public subscribe(listener: (state: State) => void): () => void {
    return this.store.subscribe(listener);
  }

  public ticks(): number {
    return this.store.getState().ticks;
  }

  public status(): State["status"] {
    return this.store.getState().status;
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
