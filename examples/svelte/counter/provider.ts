import {
  ServiceProvider,
  type ServiceProviderContext,
} from "@raubjo/architect-core";
import CounterService from "./service";

export default class CounterProvider extends ServiceProvider {
  register({ container }: ServiceProviderContext): void {
    container.singleton(CounterService, CounterService);
  }
}
