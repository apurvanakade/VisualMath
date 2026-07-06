/**
 * Copyright (c) 2026 Apurva Nakade, Copilot. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade, Copilot
 */

/**
 * Fixed-point page configuration for shared rendering helpers.
 */
(function attachFixedPointConfig(globalThis) {
  const app = globalThis.VisualMathFixedPointAppParts || (globalThis.VisualMathFixedPointAppParts = {})

  app.config = {
    plot: {
      title: "Fixed Point Iteration Cobweb Diagram",
      xRangeKey: "range",
      yRangeKey: "range",
      xAxisTitle: "x",
      yAxisTitle: "y",
      xAxis: {},
      yAxis: {
        zerolinecolor: "#94a3b8",
        gridcolor: "#e2e8f0",
        linecolor: "#cbd5e1"
      },
      layout: {
        margin: {
          l: 60,
          r: 30,
          t: 60,
          b: 55
        }
      }
    },
    table: {
      emptyMessage: "No iterations to display yet.",
      columns: [
        {header: "n", cell: row => row.i},
        {header: "x_n", cell: row => Number.isFinite(row.x) ? row.x.toPrecision(10) : "NaN"},
        {header: tex => tex`g(x_n) = x_{n+1}`, cell: row => Number.isFinite(row.gx) ? row.gx.toPrecision(10) : "NaN"},
        {header: tex => tex`|x_{n+1} - x_n|`, cell: row => Number.isFinite(row.error) ? row.error.toExponential(4) : "NaN"}
      ]
    }
  }
})(window)
