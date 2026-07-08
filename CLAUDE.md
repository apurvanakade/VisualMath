# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

VisualMath is a Quarto website of interactive, browser-based visualizations of numerical methods. There is no backend and no build tooling beyond Quarto — all interactivity runs client-side via Observable JS (OJS) cells plus vanilla JS modules, math.js, and Plotly loaded from CDNs.

## Commands

- `quarto render` — render the whole site into `docs/` (`_quarto.yml` sets `project.output-dir: docs`).
- `quarto render root-finding/newton/index.qmd` — render a single page while iterating.
- `quarto preview` — local live-reload preview server.

There are no test or lint commands; there is no package manager (no `package.json`). JS is served as static files, not bundled.

## Source vs. generated output

- Edit `.qmd`, `.css`, and `js/**` files. **`docs/` is generated** — never edit it by hand; re-render instead. (`.gitignore` ignores `docs/`, though a prior build is still tracked.)
- Deployment (`.github/workflows/deploy.yml`) publishes the `gh-pages` branch to GitHub Pages. It does **not** run `quarto render` — rendered output must reach `gh-pages` separately.

## Architecture

Each method page (`root-finding/<method>/index.qmd`) is a self-contained interactive app:

1. A raw-HTML block loads CDN scripts (math.js, Plotly), the shared `js/*.js` utilities, and the page's own `method.js`.
2. `method.js` is an IIFE that attaches one global, e.g. `window.VisualMathNewtonMethod`, exposing two functions: `compute` and `renderOutput`.
3. OJS cells wire Quarto `Inputs.*` controls → `page.compute({...})` → an `Inputs.range` step slider → `page.renderOutput({...})`. OJS reactivity re-runs everything downstream when any input changes.

`compute()` returns `{ ok, statusType, message, rows, f, ... }`. `rows` is the full iteration history; `statusType` is `"good" | "warn" | "bad"` mapping to shared CSS status classes. `renderOutput()` receives the result and the current step slider value, slices the visible rows, builds the Plotly chart and iteration table inline, and returns a DOM node.

### Shared utilities (`js/`)

Each file is a small IIFE that extends `window.VM` with one function:

- `js/make-function.js` → `VM.makeFunction(mathjs, expr)` — returns `(x) => number`, or `null` if the expression can't be parsed. Normalizes input (trim, replace `π` → `pi`), compiles via math.js, evaluates safely.
- `js/make-derivative.js` → `VM.makeDerivative(mathjs, expr)` — like `makeFunction` but returns the symbolic derivative.
- `js/padded-range.js` → `VM.paddedRange(values, opts)` — returns `{lo, hi}` with configurable padding for axis ranges.
- `js/render-table.js` → `VM.renderTable({html, headers, rows})` — returns a DOM table node styled with `ojs-table` classes.

### Adding a new method page

1. Create `root-finding/<method>/method.js` — copy an existing one and change `compute()` and `renderOutput()`. The IIFE should attach `window.VisualMath<MethodName> = {compute, renderOutput}`.
2. Create `root-finding/<method>/index.qmd` — copy an existing one, update the input labels and the page global name. The script block needs only mathjs, Plotly, the `../../js/*.js` utilities, and `method.js`.
3. Add the page to `root-finding/index.qmd` and `_quarto.yml` navigation.

User-entered expressions are evaluated in-browser. Use `VM.makeFunction` (it handles normalization and error catching). Surface invalid input through the result's `message` field rather than throwing.

## Conventions

- Every new code/content file must begin with the copyright/license header for its file type — see `CONTRIBUTING.md`. Authorship is per-file and per-contributor; add your name to `Authors:` for significant additions.
- Interactive pages use `page-layout: full` and reuse the design-system CSS classes in `styles.css` (`vm-*`, `ojs-*`, `plotly-box-large`, `ojs-status-*`, `ojs-table*`) rather than ad hoc per-page styling.
- Keep OJS logic in small named cells and keep method logic in `method.js`; the `.qmd` should mostly declare controls and wire them to the page global.
- A sibling `.github/copilot-instructions.md` covers overlapping guidance; keep the two roughly in sync when conventions change.
