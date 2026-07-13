# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

VisualMath is a Quarto website of interactive, browser-based visualizations of numerical methods. There is no backend and no build tooling beyond Quarto — all interactivity runs client-side via Observable JS (OJS) cells plus vanilla JS modules, math.js, and Plotly loaded from CDNs.

## Commands

- `quarto render` — render the whole site into `docs/` (`_quarto.yml` sets `project.output-dir: docs`).
- `quarto render root-finding/newton-method/index.qmd` — render a single page while iterating.
- `quarto preview` — local live-reload preview server.

There are no test or lint commands; there is no package manager (no `package.json`). JS is served as static files, not bundled.

## Source vs. generated output

- Edit `.qmd`, `.css`, and `js/**` files. **`docs/` is generated** — never edit it by hand; re-render instead. (`.gitignore` ignores `docs/`, though a prior build is still tracked.)
- Deployment (`.github/workflows/deploy.yml`) publishes the `gh-pages` branch to GitHub Pages. It does **not** run `quarto render` — rendered output must reach `gh-pages` separately.

## Architecture

Each method page (`root-finding/<method>/index.qmd`) is a self-contained interactive app. There is no `method.js` per page — all method logic and rendering live directly in named OJS cells inside the `.qmd`:

1. `_quarto.yml`'s global `include-in-header` loads `_includes/head-scripts.html`, which pulls in CDN scripts (math.js, Plotly) and the shared `js/**` utilities via root-relative paths (e.g. `/js/expressions/make-function.js`), exposing `window.VM` (see below). Every page gets this for free — no per-page script block is needed.
2. `result` — runs the numerical method with the current inputs (e.g. Newton, bisection, fixed-point) and returns `{rows, f, ...}`. `rows` is the full iteration history; each page's `result` cell already reads like plain imperative code (`while` loop, explicit early returns) rather than a functional pipeline.
3. `setup` — derives the data shared by the plots below from `result`: which rows are visible at the current step, axis ranges, and a sampled curve for the smooth function trace.
4. `mainPlot` — builds the primary Plotly chart. It's a closure over a `_plotDiv` variable so the same DOM node is reused across reactive re-renders (`Plotly.react` instead of `Plotly.newPlot` after the first render) — this is what preserves user zoom/pan when the step slider moves.
5. `iteratesPlot`, `convergencePlot` — Observable Plot charts covering the entire run (not just the current step), shown in a collapsed "Convergence plots" callout.
6. `iterationTable` — builds a DOM table via `VM.renderTable`, shown in a collapsed "Iteration table" callout.

OJS cells wire Quarto `Inputs.*` controls (function text, initial guess/endpoints, max iterations) → `result` → an `Inputs.range` step slider → `setup` → `mainPlot(setup)`. OJS reactivity re-runs everything downstream when any input changes.

### Shared utilities (`js/`)

`js/` is organized into subfolders by concern; each file is a small IIFE that extends `window.VM` with one function. All are loaded globally via `_includes/head-scripts.html` (referenced from `_quarto.yml`'s `include-in-header`) using root-relative paths, so they work at any page depth:

- `js/expressions/make-function.js` → `VM.makeFunction(mathjs, expr)` — returns `(x) => number`, or `null` if the expression can't be parsed. Normalizes input (trim, replace `π` → `pi`), compiles via math.js, evaluates safely.
- `js/expressions/make-derivative.js` → `VM.makeDerivative(mathjs, expr)` — like `makeFunction` but returns the symbolic derivative.
- `js/expressions/make-number.js` → `VM.makeNumber(mathjs, expr)` — evaluates a constant expression (e.g. `1 + 2*3 + pi - e`) to a JS number, or `null` if it can't be parsed. Used by all numeric input fields (initial guesses, endpoints, max iterations, ...) so they accept expressions, not just literal numbers.
- `js/expressions/make-rational.js` — rational-number/fraction-reduction helper (e.g. for displaying exact Butcher tableau coefficients).
- `js/expressions/make-ode-function.js` → `VM.makeFunction2(mathjs, expr)` — like `makeFunction` but returns `(t, y) => number`, for ODE right-hand sides `y' = f(t, y)`.
- `js/plotting/padded-range.js` → `VM.paddedRange(values, opts)` — returns `{lo, hi}` with configurable padding for axis ranges.
- `js/plotting/plotly-fullscreen-button.js` → patches `Plotly.newPlot`/`Plotly.react` to add a fullscreen-toggle button to every chart's modebar automatically — no per-page wiring needed, including on new method pages.
- `js/numerical/linear-regression.js` → `VM.linearRegression(points)` — ordinary least-squares fit of `points = [{x, y}, ...]`, returning `{slope, intercept, xlo, xhi}` or `null` if fewer than two points or a degenerate (vertical) fit. Used by every convergence-order plot.
- `js/numerical/euler-solve.js` → `VM.eulerSolve(f, t0, y0, tEnd, n)` — forward Euler stepper for `y' = f(t, y)`, returning the full trajectory `{ts, ys}`.
- `js/numerical/rk4-solve.js` → `VM.rk4Solve(f, t0, y0, tEnd, n)` — classical fourth-order Runge-Kutta stepper, returning `{ts, ys}`.
- `js/numerical/simpson-estimate.js` → `VM.simpsonEstimate(f, lo, hi, n)` — composite Simpson's rule quadrature (`n` must be even).
- `js/numerical/lagrange-quadratic.js` → `VM.lagrangeQuadratic(x0, y0, x1, y1, x2, y2, sampleCount)` — samples the quadratic interpolant through three points, returning `{xs, ys}`.
- `js/ui/render-table.js` → `VM.renderTable({html, headers, rows})` — returns a DOM table node styled with `ojs-table` classes.

`piecewise-interpolation/linear-cubic/cubic-spline.js` (`VM.cubicSpline(xs, ys)` — returns `(x) => number` evaluating the natural cubic spline through the given points, or `null` if fewer than two points) is **not** in this shared set — it's the only page that uses it, so it lives alongside `piecewise-interpolation/linear-cubic/index.qmd` and is loaded by a page-level `include-in-header` in that page's front matter (which Quarto merges with, rather than replaces, the project-level one from `_quarto.yml`). Follow this pattern — colocate the file with its one page and add a page-level `include-in-header` — for any future utility used by exactly one page; only promote a file into `js/` once a second page needs it.

### Adding a new method page

1. Create `root-finding/<method>/index.qmd` — copy an existing page (e.g. `root-finding/newton-method/index.qmd`) and adapt its `result`, `setup`, `mainPlot`, `iteratesPlot`, `convergencePlot`, and `iterationTable` cells to the new method's math and input fields. All `js/**` utilities and CDN scripts are already available globally via `_includes/head-scripts.html` — no per-page script block needed.
2. Give the front matter an `order: <n>` field one higher than the current last method — `root-finding/index.qmd`, the homepage `index.qmd`, and `_quarto.yml`'s sidebar all auto-discover pages via glob (`root-finding/*/index.qmd`) and sort on this field. No other file needs editing.

User-entered expressions are evaluated in-browser. Use `VM.makeFunction`/`VM.makeDerivative` (they handle normalization and error catching, returning `null` on a bad expression) rather than calling math.js directly. Currently, invalid input just makes `result` return empty `rows` (blank chart, empty table) — there's no surfaced error message to the user yet.

## Conventions

- Every new code/content file must begin with the copyright/license header for its file type — see `CONTRIBUTING.md`. Authorship is per-file and per-contributor; add your name to `Authors:` for significant additions.
- Interactive pages use `page-layout: full` and reuse the design-system CSS classes in `styles.css` (`ojs-panel`, `ojs-row`, `ojs-grid`, `ojs-fill`, `ojs-auto`, `ojs-table-container`, `ojs-table-toolbar`, `plotly-box-large`) rather than ad hoc per-page styling. `ojs-panel` is chrome only; `ojs-row`/`ojs-grid` are layout only — combine them (`class="ojs-panel ojs-row"`) for a standalone panel, or nest a bare `ojs-row`/`ojs-grid` inside an `ojs-panel` for a control group within a larger panel. Attach `ojs-fill`/`ojs-auto` via `classList.add` on an `Inputs.*` wrapper div to make it fill its row or keep its natural width, instead of setting `el.style` directly.
- Keep each page's logic in small named OJS cells (`result`, `setup`, `mainPlot`, `iteratesPlot`, `convergencePlot`, `iterationTable`) rather than one large cell, and keep the same cell names/shapes across method pages for consistency.
- Prefer explicit `for`/`while` loops and `if`/`else` over `.map()/.filter()/.reduce()` chains and ternaries in OJS cells and `js/**/*.js` — this codebase is read by a Python-oriented audience, and imperative control flow reads more naturally to them than JS-functional chains. Callbacks required by an API (Plotly config values, `Plot` accessors, `addEventListener`) are fine to keep; clean up their bodies per the same rule if they contain a chain/ternary. Stateful closures that exist for a real reason (e.g. `mainPlot`'s `_plotDiv` reuse) are not a style violation and shouldn't be "fixed."
