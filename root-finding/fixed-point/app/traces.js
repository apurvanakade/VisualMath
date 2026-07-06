/**
 * Copyright (c) 2026 Apurva Nakade, Copilot. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade, Copilot
 */

/**
 * Build the fixed-point plot traces.
 */
(function attachFixedPointTraces(globalThis) {
  const methodAppUtils = globalThis.VisualMathMethodAppUtils
  const plotlyTraceUtils = globalThis.VisualMathPlotlyTraceUtils
  const app = globalThis.VisualMathFixedPointAppParts || (globalThis.VisualMathFixedPointAppParts = {})

  const buildCobwebTraces = ({plotModel, x0}) => {
    if (plotModel.visibleRows.length === 0) return []

    const cobwebX = []
    const cobwebY = []
    const start = Number(x0)

    if (Number.isFinite(start)) {
      cobwebX.push(start)
      cobwebY.push(start)
    }

    for (const row of plotModel.visibleRows) {
      if (!Number.isFinite(row.x) || !Number.isFinite(row.gx)) continue

      cobwebX.push(row.x)
      cobwebY.push(row.gx)
      cobwebX.push(row.gx)
      cobwebY.push(row.gx)
    }

    return [
      plotlyTraceUtils.createLineTrace({
        x: cobwebX,
        y: cobwebY,
        name: "Cobweb path",
        color: "#dc2626",
        width: 2,
        mode: "lines+markers",
        marker: {
          color: "#dc2626",
          size: 7
        }
      })
    ]
  }

  const buildIterateTraces = plotModel => {
    if (plotModel.visibleRows.length === 0) return []

    return [
      plotlyTraceUtils.createMarkerTrace({
        x: plotModel.visibleRows.map(row => row.x).filter(Number.isFinite),
        y: plotModel.visibleRows.map(row => row.x).filter(Number.isFinite),
        name: "Iterates",
        text: plotModel.visibleRows
          .filter(row => Number.isFinite(row.x))
          .map(row => `x_${row.i}`),
        textposition: "top center",
        color: "#16a34a",
        size: 9
      })
    ]
  }

  app.buildTraces = ({plotModel, result, x0}) => [
    methodAppUtils.createSampledFunctionTrace({
      range: plotModel.range,
      fn: result.g,
      name: "g(x)",
      count: 500
    }),
    methodAppUtils.createDiagonalReferenceTrace({
      range: plotModel.range
    }),
    methodAppUtils.createHorizontalReferenceTrace({
      range: plotModel.range,
      color: "#94a3b8",
      width: 1,
      showlegend: false
    }),
    ...buildCobwebTraces({plotModel, x0}),
    ...buildIterateTraces(plotModel)
  ]
})(window)
