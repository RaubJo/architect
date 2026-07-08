import { proxy } from "valtio";
import Panel from "./panel";

export default class Service {
  main = new Panel();
  sidebar = new Panel();

  // Fields must already be plain values before wrapping — proxy() walks the
  // object's own properties at creation time to build nested proxies for
  // Panel instances. If this were wrapped from inside its own constructor
  // instead (`return proxy(this)`), these class fields would initialize
  // against the proxy via `defineProperty`, which valtio's proxy does not
  // intercept, and nested reactivity would silently break.
  static make(): Service {
    return proxy(new Service());
  }
}
