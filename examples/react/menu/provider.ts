import { ServiceProvider, ContainerContract as Container } from "@artisansdk/architect";
import Service from "./service";

export default class Menus extends ServiceProvider {

  register(container: Container): void
  {
    container.reactive(Service, Service);
  }

}
