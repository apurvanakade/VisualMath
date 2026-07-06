<!--
Copyright (c) 2026 Copilot. All rights reserved.
Released under Apache 2.0 license as described in the file LICENSE.
Authors: Copilot
-->

# VisualMath Copilot Instructions

## Build and preview commands

- `quarto render` renders the Quarto website and writes generated output to `docs/` (`_quarto.yml` sets `project.output-dir: docs`).
- `quarto render path/to/page/index.qmd` renders a single page while you work. Example: `quarto render root-finding/newton/index.qmd`.
- `quarto preview` starts the local Quarto preview server for the site.
- There are no repository-defined automated test or lint commands in manifests or workflows right now.

## High-level architecture

- This repository is a Quarto website. `_quarto.yml` defines the site shell, navbar, sidebar, MathJax HTML output, and the `docs/` render target.
- The source of truth lives in the Quarto source files and shared stylesheet: top-level pages such as `index.qmd` and `about.qmd`, module overview pages like `root-finding/index.qmd`, method pages under `root-finding/*/index.qmd`, and shared styling in `styles.css`.
- `docs/` is generated site output, not primary source. Make content and behavior changes in the `.qmd` and `.css` files, then re-render.
- Each interactive method page (`root-finding/<method>/index.qmd`) loads mathjs and Plotly from CDNs, then `js/utils.js` (shared utilities as `window.VM`), then the method's own `method.js`. OJS cells wire controls to `compute()`, then a step slider, then `renderOutput()`.
- `method.js` is an IIFE that attaches `window.VisualMath<MethodName> = {compute, renderOutput}`. `compute()` runs the algorithm and returns `{ok, statusType, message, rows, f, ...}`. `renderOutput()` slices visible rows, builds the Plotly chart and table inline, and returns a DOM node.
- GitHub Pages deployment is branch-based: `.github/workflows/deploy.yml` publishes the contents of the `gh-pages` branch.

## Adding a new method page

1. Copy an existing `method.js` and change `compute()` (the algorithm) and `renderOutput()` (the Plotly plot and table). Attach the result as `window.VisualMath<MethodName> = {compute, renderOutput}`.
2. Copy an existing `index.qmd`. Update input labels and the page global name. The script block needs only mathjs, Plotly, `../../js/utils.js`, and `method.js`.
3. Add the page to `root-finding/index.qmd` and `_quarto.yml` navigation.

## Shared utilities (`js/utils.js` → `window.VM`)

- `VM.makeFunction(mathjs, expr)` — returns `(x) => number` or `null` if the expression can't be parsed. Handles normalization and error catching.
- `VM.makeDerivative(mathjs, expr)` — like `makeFunction` but returns the symbolic derivative.
- `VM.pushFiniteValues(arr, values, opts)` — appends finite values to an array; optional `maxAbs` cap.
- `VM.paddedRange(values, opts)` — returns `{lo, hi}` with configurable padding.
- `VM.renderTable({html, headers, rows})` — returns a DOM table node with `ojs-table` classes.

## Key repository conventions

- Every new code or content file must start with the repository copyright/license header from `CONTRIBUTING.md`, using the template that matches the file type.
- Quarto pages that host interactive apps use `page-layout: full` and rely on shared CSS classes from `styles.css` rather than per-page ad hoc layout systems.
- Reuse the established VisualMath design system classes: `vm-*` for page/app chrome, `ojs-*` for app layout and controls, `plotly-box-large` for plots, `ojs-status-*` for status states, and `ojs-table*` for iteration tables.
- User-entered expressions are evaluated in-browser with math.js. Use `VM.makeFunction` — it handles normalization (trim, replace `π` → `pi`) and error catching. Surface invalid input through the status `message` field, not by throwing.
- Method implementations communicate outcome through a status enum (`good`, `warn`, `bad`) that maps directly to shared CSS classes. Preserve that contract when changing iteration logic or UI feedback.
