# Service provider cleanup via return value

Unlike Laravel (which has no teardown hooks), frontend apps genuinely unmount — on route changes, HMR, and test teardown. We added cleanup to `register()` and `boot()` as an optional return value rather than a `terminate()` or `close()` method, because the return-value shape matches established frontend conventions (React's `useEffect`, Svelte's `onDestroy`, Vue's `onUnmounted`). Providers that don't need cleanup return nothing.
