/**
 * Copyright (c) 2026 Apurva Nakade, Copilot. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade, Copilot
 */

/**
 * Newton page configuration for shared rendering helpers.
 */
(function attachNewtonConfig(globalThis) {
  const app = globalThis.VisualMathNewtonAppParts || (globalThis.VisualMathNewtonAppParts = {})

  app.config = {
    plot: {
      title: "Newton's Method Tangent Visualization",
      xRangeKey: "xRange",
      yRangeKey: "yRange",
      xAxisTitle: "x",
      yAxisTitle: "f(x)"
    },
    table: {
      emptyMessage: "No iterations to display yet.",
      columns: [
        {header: "n", cell: row => row.i},
        {header: tex => tex`x_n`, cell: row => Number.isFinite(row.x) ? row.x.toPrecision(10) : "NaN"},
        {header: tex => tex`f(x_n)`, cell: row => Number.isFinite(row.fx) ? row.fx.toExponential(5) : "NaN"},
        {header: tex => tex`f'(x_n)`, cell: row => Number.isFinite(row.dfx) ? row.dfx.toExponential(5) : "NaN"},
        {header: tex => tex`x_{n+1}`, cell: row => Number.isFinite(row.xNext) ? row.xNext.toPrecision(10) : "NaN"},
        {header: tex => tex`|x_{n+1} - x_n|`, cell: row => Number.isFinite(row.error) ? row.error.toExponential(4) : "NaN"}
      ]
    }
  }
})(window)
