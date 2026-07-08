import {
  ServiceProvider,
  type Cleanup,
  ContainerContract as Container
} from "@raubjo/architect";
import Service from "./service";

export default class Heartbeat extends ServiceProvider {
  register(container: Container): void {
    container.singleton(Service, Service)
  }

  boot(container: Container): Cleanup {
    return container.get(Service).start();
  }
}
