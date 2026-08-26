import {
  ServiceProvider,
  ContainerContract as Container
} from "@artisansdk/architect";
import Service from "./service";

export default class Heartbeat extends ServiceProvider {
  register(container: Container): void {
    container.singleton(Service, Service)
  }

  boot(container: Container): void {
    container.get(Service).start();
  }

  destroy(container: Container): void {
    container.get(Service).stop();
  }
}
