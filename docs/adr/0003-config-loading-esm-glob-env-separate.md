# Config loading uses ESM glob for files; env vars are a separate concern

Application config is loaded by scanning `.js`/`.ts` config files via `import.meta.glob()` in `src/config/discovery.ts`. This loader is intentionally hardcoded into `Application` — it is not a swappable adapter. Environment variable access is handled separately via the `env()` helper and is not part of the file-based config pipeline.

We considered making the loader swappable (injected at construction time, like `Renderer`), but rejected it because there is only one loader in practice and the ESM glob convention is the config contract, not an implementation detail. A swappable seam would add abstraction with no second adapter to justify it.
