# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

VisualMath is a Quarto website of interactive, browser-based visualizations of numerical methods. There is no backend and no build tooling beyond Quarto — all interactivity runs client-side via Observable JS (OJS) cells plus vanilla JS modules, math.js, and Plotly loaded from CDNs.

## Commands

- `quarto render` — render the whole site into `docs/` (`_quarto.yml` sets `project.output-dir: docs`).
- `quarto render computational-math/root-finding/newton-method/index.qmd` — render a single page while iterating.
- `quarto preview` — local live-reload preview server.
- `npm test` — runs `js/**/*.test.js` (Node's built-in test runner) against pure-logic `VM.*` functions. Requires `npm install` once first.
- `npm run verify` — `quarto render` then a headless-browser pass over every rendered page (clicks every button, nudges every slider, asserts zero console/page errors). This is what actually catches a broken `VM.category.fn` call site — `quarto render` alone only catches Pandoc/parse errors, not OJS runtime errors. See `.claude/skills/verify/SKILL.md` for the full two-tier verification approach and why it's structured this way.

There is no lint command. `package.json` is dev-only (Playwright for `npm run verify`, mathjs for testing `js/expressions/*`) — nothing in it is shipped to `docs/` or affects the site's runtime; the site itself still has no bundler and no build step beyond `quarto render`. JS is served as static files, not bundled.

## Source vs. generated output

- Edit `.qmd`, `.css`, and `js/**` files. **`docs/` is generated** — never edit it by hand; re-render instead. (`.gitignore` ignores `docs/`, though a prior build is still tracked.)
- `.github/workflows/publish.yml` renders the site and publishes `docs/` to the `gh-pages` branch automatically on every push to `main`. `.github/workflows/deploy.yml` then deploys whatever is on `gh-pages` to GitHub Pages (triggered by pushes to that branch) — the two are separate workflows because `actions/deploy-pages` needs the already-rendered output as its own checkout ref.

## Architecture

Each method page (`computational-math/<topic>/<method>/index.qmd`) is a self-contained interactive app. There is no `method.js` per page — all method logic and rendering live directly in named OJS cells inside the `.qmd`:

1. `_quarto.yml`'s global `include-in-header` loads `_includes/head-scripts.html`, which pulls in CDN scripts (math.js, Plotly) and the shared `js/**` utilities via root-relative paths (e.g. `/js/expressions/make-function.js`), exposing `window.VM` (see below). Every page gets this for free — no per-page script block is needed.
2. `result` — runs the numerical method with the current inputs (e.g. Newton, bisection, fixed-point) and returns `{rows, f, ...}`. `rows` is the full iteration history; each page's `result` cell already reads like plain imperative code (`while` loop, explicit early returns) rather than a functional pipeline.
3. `setup` — derives the data shared by the plots below from `result`: which rows are visible at the current step, axis ranges, and a sampled curve for the smooth function trace.
4. `mainPlot` — builds the primary Plotly chart. It's a closure over a `_plotDiv` variable so the same DOM node is reused across reactive re-renders (`Plotly.react` instead of `Plotly.newPlot` after the first render) — this is what preserves user zoom/pan when the step slider moves.
5. `iteratesPlot`, `convergencePlot` — Observable Plot charts covering the entire run (not just the current step), shown in a collapsed "Convergence plots" callout.
6. `iterationTable` — builds a DOM table via `VM.ui.renderTable`, shown in a collapsed "Iteration table" callout.

OJS cells wire Quarto `Inputs.*` controls (function text, initial guess/endpoints, max iterations) → `result` → an `Inputs.range` step slider → `setup` → `mainPlot(setup)`. OJS reactivity re-runs everything downstream when any input changes.

### Shared utilities (`js/`)

`js/` is organized into subfolders by concern; each file is a small IIFE that extends `window.VM` with one function, nested under a category matching its subfolder (`VM.<category>.<fn>`) — e.g. `js/numerical/euler-solve.js` extends `VM.numerical` with `eulerSolve`. This keeps the shared namespace scannable as it grows; when adding a new category, follow the same pattern (nest under a new `VM.<category>`, matching a new `js/<category>/` folder) rather than adding flat top-level functions. All are loaded globally via `_includes/head-scripts.html` (referenced from `_quarto.yml`'s `include-in-header`) using root-relative paths, so they work at any page depth:

**`VM.expressions`**

- `js/expressions/make-function.js` → `VM.expressions.makeFunction(mathjs, expr)` — returns `(x) => number`, or `null` if the expression can't be parsed. Normalizes input (trim, replace `π` → `pi`), compiles via math.js, evaluates safely.
- `js/expressions/make-derivative.js` → `VM.expressions.makeDerivative(mathjs, expr)` — like `makeFunction` but returns the symbolic derivative.
- `js/expressions/make-number.js` → `VM.expressions.makeNumber(mathjs, expr)` — evaluates a constant expression (e.g. `1 + 2*3 + pi - e`) to a JS number, or `null` if it can't be parsed. Used by all numeric input fields (initial guesses, endpoints, max iterations, ...) so they accept expressions, not just literal numbers.
- `js/expressions/make-rational.js` → `VM.expressions.makeRational` — rational-number/fraction-reduction helper (e.g. for displaying exact Butcher tableau coefficients).
- `js/expressions/make-ode-function.js` → `VM.expressions.makeFunction2(mathjs, expr)` — like `makeFunction` but returns `(t, y) => number`, for ODE right-hand sides `y' = f(t, y)`.

**`VM.numerical`**

- `js/numerical/linear-regression.js` → `VM.numerical.linearRegression(points)` — ordinary least-squares fit of `points = [{x, y}, ...]`, returning `{slope, intercept, xlo, xhi}` or `null` if fewer than two points or a degenerate (vertical) fit. Used by every convergence-order plot.
- `js/numerical/euler-solve.js` → `VM.numerical.eulerSolve(f, t0, y0, tEnd, n)` — forward Euler stepper for `y' = f(t, y)`, returning the full trajectory `{ts, ys}`.
- `js/numerical/rk4-solve.js` → `VM.numerical.rk4Solve(f, t0, y0, tEnd, n)` — classical fourth-order Runge-Kutta stepper, returning `{ts, ys}`.
- `js/numerical/simpson-estimate.js` → `VM.numerical.simpsonEstimate(f, lo, hi, n)` — composite Simpson's rule quadrature (`n` must be even).
- `js/numerical/lagrange-quadratic.js` → `VM.numerical.lagrangeQuadratic(x0, y0, x1, y1, x2, y2, sampleCount)` — samples the quadratic interpolant through three points, returning `{xs, ys}`.

**`VM.plotting`**

- `js/plotting/padded-range.js` → `VM.plotting.paddedRange(values, opts)` — returns `{lo, hi}` with configurable padding for axis ranges.
- `js/plotting/plotly-fullscreen-button.js` → `VM.plotting.fullscreenButton` — patches `Plotly.newPlot`/`Plotly.react` to add a fullscreen-toggle button to every chart's modebar automatically; the patching happens on load, so no per-page wiring or explicit call is needed, including on new method pages.

**`VM.ui`**

- `js/ui/render-table.js` → `VM.ui.renderTable({html, headers, rows})` — returns a DOM table node styled with `ojs-table` classes.

**`VM.discreteMath`**

- `js/discrete-math/barycentric-triples.js` → `VM.discreteMath.barycentricTriples(N)` — every barycentric triple `[i, j, k]` (`i + j + k = N`) of a uniform order-`N` triangulation.
- `js/discrete-math/sub-triangles.js` → `VM.discreteMath.subTriangleTriples(N)` — enumerates the small triangles of that triangulation as triples of barycentric triples.
- `js/discrete-math/triangulation-edges.js` → `VM.discreteMath.triangulationEdges(N)` — every edge of that triangulation exactly once, deduped from `subTriangleTriples`.
- `js/discrete-math/sperner-color.js` → `VM.discreteMath.spernerColor(a, b, c)` — colors a barycentric triple per Sperner's condition (fixed vertex colors, boundary points restricted to their edge's two endpoint colors, interior points free).
- `js/discrete-math/random-color.js` → `VM.discreteMath.randomColor()` — uniform random red/green/blue, ignoring position; used to demonstrate violating Sperner's condition.
- `js/discrete-math/mixed-pair-color.js` → `VM.discreteMath.pairColor(colorA, colorB)` — the shared gold/teal/orchid color for a two-color (red+green / green+blue / red+blue) pair, or `null` if the colors match.
- `js/discrete-math/triangle-fill-color.js` → `VM.discreteMath.triangleFillColor(colors)` — the shared fill for a rainbow (three distinct colors) triangle, or `'none'` otherwise.

`computational-math/piecewise-interpolation/linear-cubic/cubic-spline.js` (`VM.cubicSpline(xs, ys)` — returns `(x) => number` evaluating the natural cubic spline through the given points, or `null` if fewer than two points) is **not** in this shared set, and stays flat rather than nested — it's the only page that uses it, so it lives alongside `computational-math/piecewise-interpolation/linear-cubic/index.qmd` and is loaded by a page-level `include-in-header` in that page's front matter (which Quarto merges with, rather than replaces, the project-level one from `_quarto.yml`). Follow this pattern — colocate the file with its one page and add a page-level `include-in-header` — for any future utility used by exactly one page; only promote a file into `js/` (nested under its category) once a second page needs it.

If any single `VM.<category>` grows past ~15 functions, split its doc block above further (e.g. by sub-concern) rather than letting one flat list run long — the whole point of nesting was to keep this scannable as more math functions get added.

### Adding a new method page (`computational-math`)

1. Create `computational-math/root-finding/<method>/index.qmd` — copy an existing page (e.g. `computational-math/root-finding/newton-method/index.qmd`) and adapt its `result`, `setup`, `mainPlot`, `iteratesPlot`, `convergencePlot`, and `iterationTable` cells to the new method's math and input fields. All `js/**` utilities and CDN scripts are already available globally via `_includes/head-scripts.html` — no per-page script block needed. Give it a `categories:` list describing the method (used by every listing page's category filter, see below).
2. Give the front matter an `order: <n>` field one higher than the current last method — `computational-math/root-finding/index.qmd` (`contents: "*/index.qmd"`), `computational-math/index.qmd` (`"*/*/index.qmd"`), and the homepage `index.qmd` (`"*/*/*/index.qmd"`) all auto-discover the new page's card via glob and sort on this field. `_quarto.yml`'s sidebar is the only place that needs manual editing, and only when adding a brand-new topic (see next section) — it's an explicit nested menu, not a glob-generic listing.

User-entered expressions are evaluated in-browser. Use `VM.expressions.makeFunction`/`VM.expressions.makeDerivative` (they handle normalization and error catching, returning `null` on a bad expression) rather than calling math.js directly. Currently, invalid input just makes `result` return empty `rows` (blank chart, empty table) — there's no surfaced error message to the user yet.

### Adding a new expository/proof page (`discrete-math`, or any future non-`computational-math` topic)

Same auto-discovery mechanics as above, one level deeper since each topic gets its own subdirectory:

1. Create `discrete-math/<topic>/<page>/index.qmd` (e.g. `discrete-math/sperners-lemma/<page>/index.qmd`) — the file must be named `index.qmd` for the glob patterns below to find it (not `<page-name>.qmd`). Give it a `categories:` list (used by every listing page's category filter, see below).
2. Give the front matter an `order: <n>` field (reading order within the topic; these pages are proof/exposition steps, not independent methods, so order matters more than in `computational-math`).
3. If this is a new topic (not just a new page in `sperners-lemma`), add a `discrete-math/<topic>/index.qmd` listing page — copy `discrete-math/sperners-lemma/index.qmd`'s front matter (`listing: {contents: "*/index.qmd", type: grid, sort: "date desc", fields: [image, title, description, categories], categories: true}`) — and add `discrete-math/<topic>/*/index.qmd` to `_quarto.yml`'s sidebar, matching the existing `discrete-math/sperners-lemma/*` entry. The section listing (`discrete-math/index.qmd`, `contents: "*/*/index.qmd"`) and the homepage (`"*/*/*/index.qmd"`) use fixed-depth globs that already reach every leaf page under any topic, so neither needs editing for a new topic.
4. Not every page needs interactivity — `barycentric-coordinates/index.qmd` and the proof pages mix substantial static exposition with one or two `{ojs}` apps, unlike `computational-math` pages which are interactive-app-first with prose secondary.

## Math exposition conventions

Patterns established across the `discrete-math/sperners-lemma` pages, worth reusing for future proof/exposition content rather than reinventing per page:

- **Crossref-labeled theorem/definition callouts**: `::: {#thm-name}\n...\n:::` (also `#def-`, `#cnj-` for conjectures/claims still to prove, `#cor-` for corollaries), referenced elsewhere in the same or other pages via `@thm-name` — Quarto resolves these to numbered links ("Theorem 1") automatically. Pick a short, descriptive slug (`#thm-sperner-local`, not `#thm-1`) since it's also the anchor.
- **Scaffolded exercises**: a `::: {.callout-tip title="Exercise"}` with the claim to prove (referencing it via `@cnj-name` rather than restating it) and numbered sub-steps, followed by one or more `::: {.callout-note collapse="true" title="Hint for step N"}` / `title="Solution sketch"` callouts a reader has to click to reveal. See `combinatorial-proof/index.qmd`'s proof of `@cnj-bottom` for the full pattern. Don't put a crossref inside a callout's `title="..."` attribute itself (e.g. `title="Exercise: prove @cnj-bottom"`) — Quarto doesn't resolve crossrefs inside raw attribute strings, only in rendered body content, so it leaks through unprocessed; put the crossref in the callout body instead.
- **References**: a `## References` section near the end, plain Markdown citations with inline links (author, title, venue, year, URL) — see `geometric-proof/index.qmd` for the existing example. No BibTeX/CSL setup in this project yet.
- Interactive apps embedded in an expository page follow the same shared-palette conventions as any other page (`VM.discreteMath.*` for triangle/edge coloring, etc.) — exposition pages aren't exempt from the `js/**` sharing rule just because they're prose-heavy.

## Conventions

- Every new code/content file must begin with the copyright/license header for its file type — see `CONTRIBUTING.md`. Authorship is per-file and per-contributor; add your name to `Authors:` for significant additions.
- Interactive pages reuse the design-system CSS classes in `styles.css` (`ojs-panel`, `ojs-row`, `ojs-grid`, `ojs-fill`, `ojs-auto`, `ojs-table-container`, `ojs-table-toolbar`, `plotly-box-large`) rather than ad hoc per-page styling. `ojs-panel` is chrome only; `ojs-row`/`ojs-grid` are layout only — combine them (`class="ojs-panel ojs-row"`) for a standalone panel, or nest a bare `ojs-row`/`ojs-grid` inside an `ojs-panel` for a control group within a larger panel. Attach `ojs-fill`/`ojs-auto` via `classList.add` on an `Inputs.*` wrapper div to make it fill its row or keep its natural width, instead of setting `el.style` directly.
- Keep each page's logic in small named OJS cells (`result`, `setup`, `mainPlot`, `iteratesPlot`, `convergencePlot`, `iterationTable`) rather than one large cell, and keep the same cell names/shapes across method pages for consistency.
- Prefer explicit `for`/`while` loops and `if`/`else` over `.map()/.filter()/.reduce()` chains and ternaries in OJS cells and `js/**/*.js` — this codebase is read by a Python-oriented audience, and imperative control flow reads more naturally to them than JS-functional chains. Callbacks required by an API (Plotly config values, `Plot` accessors, `addEventListener`) are fine to keep; clean up their bodies per the same rule if they contain a chain/ternary. Stateful closures that exist for a real reason (e.g. `mainPlot`'s `_plotDiv` reuse) are not a style violation and shouldn't be "fixed."
