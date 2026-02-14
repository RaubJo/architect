export default class CounterService {
  protected count = 0;

  increment(): number {
    this.count += 1;
    return this.count;
  }

  current(): number {
    return this.count;
  }
}
