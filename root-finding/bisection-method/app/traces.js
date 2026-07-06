/**
 * Copyright (c) 2026 Apurva Nakade, Copilot. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade, Copilot
 */

/**
 * Build the bisection plot traces.
 */
(function attachBisectionTraces(globalThis) {
  const methodAppUtils = globalThis.VisualMathMethodAppUtils
  const plotlyTraceUtils = globalThis.VisualMathPlotlyTraceUtils
  const app = globalThis.VisualMathBisectionAppParts || (globalThis.VisualMathBisectionAppParts = {})

  const buildPointTraces = plotModel => {
    if (!plotModel.currentBisectionRow) return []

    const row = plotModel.currentBisectionRow
    return [
      plotlyTraceUtils.createMarkerTrace({
        x: [row.a, row.b],
        y: [row.fa, row.fb],
        name: "Endpoints",
        text: ["a", "b"],
        textposition: "top center",
        color: "#2563eb",
        size: 11
      }),
      plotlyTraceUtils.createMarkerTrace({
        x: [row.m],
        y: [row.fm],
        name: "Midpoint",
        text: ["m"],
        textposition: "top center",
        color: "#dc2626",
        size: 13
      })
    ]
  }

  const buildGuideTraces = plotModel => {
    if (!plotModel.currentBisectionRow) return []

    const row = plotModel.currentBisectionRow
    return [
      plotlyTraceUtils.createLineTrace({
        x: [row.a, row.a],
        y: [0, row.fa],
        name: "Endpoint guides",
        color: "#94a3b8",
        width: 1.5,
        dash: "dot",
        showlegend: false,
        hoverinfo: "skip"
      }),
      plotlyTraceUtils.createLineTrace({
        x: [row.b, row.b],
        y: [0, row.fb],
        name: "Endpoint guides",
        color: "#94a3b8",
        width: 1.5,
        dash: "dot",
        showlegend: false,
        hoverinfo: "skip"
      }),
      plotlyTraceUtils.createLineTrace({
        x: [row.m, row.m],
        y: [0, row.fm],
        name: "Midpoint guide",
        color: "#dc2626",
        width: 1.5,
        dash: "dot",
        showlegend: false,
        hoverinfo: "skip"
      })
    ]
  }

  app.buildTraces = ({plotModel, result}) => [
    methodAppUtils.createSampledFunctionTrace({
      range: plotModel.xRange,
      fn: result.f,
      name: "f(x)"
    }),
    methodAppUtils.createHorizontalReferenceTrace({
      range: plotModel.xRange
    }),
    ...buildPointTraces(plotModel),
    ...buildGuideTraces(plotModel)
  ]
})(window)
