import { ServiceProvider, ContainerContract as Container } from "@raubjo/architect";
import HeartbeatService from "./service";

export default class HeartbeatProvider extends ServiceProvider {
  register(container: Container): void {
    container.singleton(HeartbeatService, HeartbeatService);
  }

  boot(container: Container): void {
    container.get(HeartbeatService).start();
  }

  destroy(container: Container): void {
    container.get(HeartbeatService).stop();
  }
}
