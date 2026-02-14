# Examples

These are minimal examples showing how to bootstrap `@raubjo/architect-core` with each supported runtime.

- `react`
- `solid`
- `svelte`
- `vue`

Each example focuses on:

1. Registering tow service providers.
    - One where state is updated by action of the user and rerendered.
    - One where state is updated by external mechanism and rerendered.
2. Rendering a root component.
3. Resolving a service from the runtime helper.

## Run an example

From one of the example folders:

```bash
bun install
bun run dev
```

Example:

```bash
cd ./simple-react
bun install
bun run dev
```
