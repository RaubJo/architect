import { ServiceProvider, type Cleanup, ContainerContract as Container } from "@raubjo/architect";
import HeartbeatService from "./service";

export default class HeartbeatProvider extends ServiceProvider {
  register(container: Container): void {
    container.singleton(HeartbeatService, HeartbeatService);
  }

  boot(container: Container): Cleanup {
    return container.get(HeartbeatService).start();
  }
}
