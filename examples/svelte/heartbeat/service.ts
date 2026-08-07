type Status = "running" | "stopped";

export default class HeartbeatService {
  protected intervalId: number | null = null;
  protected tickCount = 0;
  protected currentStatus: Status = "stopped";

  ticks(): number {
    return this.tickCount;
  }

  status(): Status {
    return this.currentStatus;
  }

  start(): void {
    if (this.intervalId !== null) {
      return;
    }

    this.currentStatus = "running";
    this.intervalId = window.setInterval(() => {
      this.tickCount += 1;
    }, 1000);
  }

  stop(): void {
    if (this.intervalId === null) {
      return;
    }

    window.clearInterval(this.intervalId);
    this.intervalId = null;
    this.currentStatus = "stopped";
  }

  toggle(): void {
    if (this.currentStatus === "running") {
      this.stop();
      return;
    }

    this.start();
  }
}
