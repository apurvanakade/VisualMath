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
- Each interactive method page is self-contained in one `.qmd` file. The page loads `math.js` and Plotly from CDNs, defines controls with Observable/Quarto OJS cells (`Inputs.text`, `Inputs.number`, `Inputs.range`, `Inputs.checkbox`), computes the full iteration history in reactive cells, derives the currently visible step subset, and then renders the Plotly figure, status callout, and iteration table from that state.
- The three root-finding methods share the same app composition pattern: hero section -> controls card -> step buttons -> computed result object -> derived visible rows/ranges -> Plotly plot -> status box -> iteration table -> prose explanation.
- GitHub Pages deployment is branch-based: `.github/workflows/deploy.yml` publishes the contents of the `gh-pages` branch.

## Key repository conventions

- Every new code or content file must start with the repository copyright/license header from `CONTRIBUTING.md`, using the template that matches the file type.
- Quarto pages that host interactive apps use `page-layout: full` and rely on shared CSS classes from `styles.css` rather than per-page ad hoc layout systems.
- Reuse the established VisualMath design system classes when extending UI: `vm-*` for page/app chrome, `ojs-*` for app layout and controls, `plotly-box-large` for plots, `ojs-status-*` for status states, and `ojs-table*` for iteration tables.
- Keep OJS logic split into small named cells instead of one large script. The repeated pattern in method pages is: parse/compile helpers -> method result object -> visible rows -> plot ranges -> plot cell -> status cell -> table cell.
- User-entered expressions are evaluated in-browser with `math.js`. Follow the existing normalization pattern before compiling expressions (trim input and replace `π` with `pi`), and surface invalid input through status objects/messages instead of throwing.
- Method implementations already communicate outcome through a small status enum (`good`, `warn`, `bad`) that maps directly to shared CSS classes. Preserve that contract when changing iteration logic or UI feedback.
