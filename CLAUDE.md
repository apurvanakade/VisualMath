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

Each method page (`root-finding/<method>/index.qmd`) is a self-contained interactive app that follows one shared composition:

1. A raw-HTML block loads CDN scripts (math.js, Plotly), the shared `js/utils/*` helpers, and the page's own `method.js`.
2. `method.js` is an IIFE that attaches a single global, e.g. `window.VisualMathNewtonMethod`, exposing `compute`, `createStepControl`, and `renderOutput`.
3. OJS cells wire Quarto `Inputs.*` controls → `page.compute({...})` → `page.createStepControl({...})` → `page.renderOutput({...})`. OJS reactivity re-runs everything downstream when an input or the step control changes.

`compute()` returns a plain result object: `{ ok, statusType, message, rows, f, df, ... }`. `rows` is the full iteration history; `statusType` is the enum `"good" | "warn" | "bad"` mapping to shared CSS status classes. `renderOutput()` slices the currently visible rows from the step control, builds the Plotly model/data, and returns a DOM node containing plot + status box + iteration table.

### Shared JS utilities (`js/utils/`)

Each is an IIFE attaching one global to `window`:

- `math-expression.js` → `VisualMathExpressionUtils` — compile/evaluate user expressions and derivatives via math.js.
- `plot-model.js` → `VisualMathPlotModelUtils` — `pushFiniteValues` and `createPaddedRange` for computing padded axis ranges.
- `render-table.js` → `VisualMathRenderTableUtils`, `step-control.js` → `VisualMathStepControlUtils` — DOM rendering helpers.

Helpers are shared only when the logic is non-trivial and reused. Small one-liners (row slicing, the status callout div) live inline in each `method.js` rather than behind a util. Each page samples the user function once (in `buildPlotModel`) and reuses those points for both the y-range and the plotted trace.

When adding or renaming a util module, keep three things consistent: the `<script src=...>` tags in every method `.qmd`, the global names each `method.js` reads at the top of its IIFE, and the files in `js/utils/`. A page loads a helper only if its `.qmd` includes the matching script tag.

User-entered expressions are evaluated in-browser. Normalize input before compiling (trim, replace `π` → `pi`) and surface invalid input through the status object/message rather than throwing.

## Conventions

- Every new code/content file must begin with the copyright/license header for its file type — see `CONTRIBUTING.md`. Authorship is per-file and per-contributor; add your name to `Authors:` for significant additions.
- Interactive pages use `page-layout: full` and reuse the design-system CSS classes in `styles.css` (`vm-*`, `ojs-*`, `plotly-box-large`, `ojs-status-*`, `ojs-table*`) rather than ad hoc per-page styling.
- Keep OJS logic in small named cells and keep method logic in `method.js`; the `.qmd` should mostly declare controls and wire them to the page global.
- A sibling `.github/copilot-instructions.md` covers overlapping guidance; keep the two roughly in sync when conventions change.
