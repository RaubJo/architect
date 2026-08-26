import { ServiceProvider, ContainerContract as Container } from "@artisansdk/architect";
import CounterService from "./service";

export default class CounterProvider extends ServiceProvider {
  register( container : Container): void {
    container.singleton(CounterService, CounterService);
  }
}
