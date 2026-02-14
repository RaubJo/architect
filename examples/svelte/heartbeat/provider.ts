import {
  ServiceProvider,
  type Cleanup,
  type ServiceProviderContext,
} from "@raubjo/architect-core";
import HeartbeatService from "./service";

export default class HeartbeatProvider extends ServiceProvider {
  register({ container }: ServiceProviderContext): void {
    container.singleton(HeartbeatService, HeartbeatService);
  }

  boot({ container }: ServiceProviderContext): Cleanup {
    return container.get(HeartbeatService).start();
  }
}
