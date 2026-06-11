# Utilities ship in architect via subpath exports

Laravel-inspired utility classes (Collection, Arr, etc.) will live in `@raubjo/architect` rather than a separate package. A separate package was considered but rejected: because utilities are exposed as individual subpath exports (e.g. `@raubjo/architect/utils/collection`), consumers only pay for what they import and bundlers treeshake the rest. Since bundle size is solved by treeshaking, the complexity of a separate package is unnecessary.
