# ContainerContract retained from Inversify era

`ContainerContract` exists because the container was originally backed by Inversify. When we replaced it with `BuiltinContainer`, the interface was kept as a seam even though only one adapter now exists. We considered removing it but left it in place — the abstraction is not harmful and removal would be pure churn with no behavioural gain.

Do not interpret the single-adapter seam as an invitation to add a second container implementation. If a future need for a swappable container arises, revisit then.
