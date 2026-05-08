type Pipe<T> = (passable: T, next: (passable: T) => T) => T;

class PipelineRunner<T> {
    passable!: T;
    pipes: Pipe<T>[] = [];

    through(pipes: Pipe<T>[]): this {
        this.pipes = [...pipes];
        return this;
    }

    then(destination: (passable: T) => T): T {
        const fn = [...this.pipes].reverse().reduce<(passable: T) => T>(
            (next, pipe) => (passable) => pipe(passable, next),
            destination,
        );
        return fn(this.passable);
    }

    thenReturn(): T {
        return this.then((passable) => passable);
    }
}

export function send<T>(passable: T): PipelineRunner<T> {
    const runner = new PipelineRunner<T>();
    runner.passable = passable;
    return runner;
}
