/**
 * Copyright (c) 2026 Apurva Nakade, Copilot. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade, Copilot
 */

/**
 * Bisection page configuration for shared rendering helpers.
 */
(function attachBisectionConfig(globalThis) {
  const app = globalThis.VisualMathBisectionAppParts || (globalThis.VisualMathBisectionAppParts = {})

  app.config = {
    plot: {
      title: "Bisection Method",
      xRangeKey: "xRange",
      yRangeKey: "yRange",
      xAxisTitle: "x",
      yAxisTitle: "f(x)",
      getShapes: plotModel => {
        if (!plotModel.currentBisectionRow) return []

        const row = plotModel.currentBisectionRow
        return [{
          type: "rect",
          xref: "x",
          yref: "paper",
          x0: row.a,
          x1: row.b,
          y0: 0,
          y1: 1,
          fillcolor: "rgba(37, 99, 235, 0.14)",
          line: {
            width: 0
          }
        }]
      }
    },
    table: {
      emptyMessage: "No iterations to display yet.",
      columns: [
        {header: "n", cell: row => row.n},
        {header: tex => tex`a_n`, cell: row => Number.isFinite(row.a) ? row.a.toPrecision(10) : "NaN"},
        {header: tex => tex`b_n`, cell: row => Number.isFinite(row.b) ? row.b.toPrecision(10) : "NaN"},
        {header: tex => tex`m_n`, cell: row => Number.isFinite(row.m) ? row.m.toPrecision(10) : "NaN"},
        {header: tex => tex`f(a_n)`, cell: row => Number.isFinite(row.fa) ? row.fa.toExponential(5) : "NaN"},
        {header: tex => tex`f(b_n)`, cell: row => Number.isFinite(row.fb) ? row.fb.toExponential(5) : "NaN"},
        {header: tex => tex`f(m_n)`, cell: row => Number.isFinite(row.fm) ? row.fm.toExponential(5) : "NaN"},
        {header: "width", cell: row => Number.isFinite(row.width) ? row.width.toExponential(4) : "NaN"}
      ]
    }
  }
})(window)
