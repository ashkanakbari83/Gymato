# Performance notes

What was done (branch `perf/optimizations`) and why:

- **Lazy starter data** (`src/data/seed.js`): loaded with a dynamic import only on a first run, an upgrade of an older save, or a backup import. Returning users download ~19 KB (gzip) less. `ensureSeed()` / `needsSeed()` live in `src/lib/storage.js`; tests load it through `src/lib/__tests__/setup.js`.
- **Debounced saving**: `scheduleSave` writes the whole state (~800 KB) once, 250 ms after the last change, and right away on `pagehide` / tab hidden. The first write after a plain start is skipped (nothing changed). If the saved data is wiped from outside, a pending write does not bring it back.
- **Trainers list paging**: 24 cards first, "show more" adds 24. Featured trainers sort first, so paging never hides them.
- **`content-visibility: auto`** on client cards and plain list rows (not on trainer cards: premium cards glow outside their box).
- **Fonts**: preload of the two Persian weights; legacy `.woff` files are no longer precached by the service worker.
- **Caching headers** (`vercel.json`): immutable hashed assets, short caches for icons/manifest, no cache for `sw.js`. Only effective on Vercel.
- First-run users get a `modulepreload` for the seed chunk so the extra request starts early.

Measured at 4x CPU throttle (single machine, noisy): warm script time 271 → 148 ms, layout 147 → 84 ms, DOM nodes after a short session 10.5k → 6.4k, warm LCP 848 → 688 ms. Cold first run is about the same or slightly slower (one extra chunk).
