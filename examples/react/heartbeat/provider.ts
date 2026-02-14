import {
  ServiceProvider,
  type Cleanup,
  type ServiceProviderContext,
} from "@raubjo/architect-core";
import Service from "./service";

export default class Heartbeat extends ServiceProvider {
  register({ container }: ServiceProviderContext): void {
    container.singleton(Service, Service)
  }

  boot({ container }: ServiceProviderContext): Cleanup {
    return container.get(Service).start();
  }
}
