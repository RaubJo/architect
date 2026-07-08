export default class Panel {
  protected open = false;

  show() {
    this.open = true;
    return this;
  }

  hide() {
    this.open = false;
    return this;
  }

  toggle() {
    this.open = !this.open;
    return this;
  }

  isOpen(): boolean {
    return this.open;
  }

  isClosed(): boolean {
    return !this.open;
  }
}
