/**
 * Copyright (c) 2026 Apurva Nakade, Copilot. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade, Copilot
 */

/**
 * Build the Newton plot traces.
 */
(function attachNewtonTraces(globalThis) {
  const methodAppUtils = globalThis.VisualMathMethodAppUtils
  const plotlyTraceUtils = globalThis.VisualMathPlotlyTraceUtils
  const app = globalThis.VisualMathNewtonAppParts || (globalThis.VisualMathNewtonAppParts = {})

  const buildGuideTraces = plotModel =>
    plotModel.visibleNewtonPoints.map(pt =>
      plotlyTraceUtils.createLineTrace({
        x: [pt.x, pt.x],
        y: [0, pt.fx],
        name: "Vertical guides",
        color: "#94a3b8",
        width: 1.5,
        dash: "dot",
        showlegend: false,
        hoverinfo: "skip"
      })
    )

  const buildTangentTraces = plotModel => {
    const traces = []
    let tangentLegendShown = false

    for (const row of plotModel.visibleRows) {
      if (
        !Number.isFinite(row.x) ||
        !Number.isFinite(row.fx) ||
        !Number.isFinite(row.dfx) ||
        !Number.isFinite(row.xNext)
      ) {
        continue
      }

      const xlo = plotModel.xRange.lo
      const xhi = plotModel.xRange.hi
      const tlo = Math.max(xlo, Math.min(row.x, row.xNext) - 0.75)
      const thi = Math.min(xhi, Math.max(row.x, row.xNext) + 0.75)
      const tangentXs = [tlo, thi]
      const tangentYs = tangentXs.map(x => row.fx + row.dfx * (x - row.x))

      traces.push(
        plotlyTraceUtils.createLineTrace({
          x: tangentXs,
          y: tangentYs,
          name: "Tangent lines",
          color: "#dc2626",
          width: 2.5,
          dash: "dash",
          showlegend: !tangentLegendShown
        })
      )

      tangentLegendShown = true
    }

    return traces
  }

  const buildPointTraces = plotModel => {
    const traces = []

    if (plotModel.visibleNewtonPoints.length > 0) {
      traces.push(
        plotlyTraceUtils.createMarkerTrace({
          x: plotModel.visibleNewtonPoints.map(pt => pt.x),
          y: plotModel.visibleNewtonPoints.map(pt => pt.fx),
          name: "Newton points",
          text: plotModel.visibleNewtonPoints.map(pt => `x_${pt.i}`),
          textposition: "top center",
          color: "#dc2626",
          size: 10
        })
      )
    }

    if (plotModel.visibleNewtonIntercepts.length > 0) {
      traces.push(
        plotlyTraceUtils.createMarkerTrace({
          x: plotModel.visibleNewtonIntercepts.map(pt => pt.x),
          y: plotModel.visibleNewtonIntercepts.map(pt => pt.y),
          name: "Tangent x-intercepts",
          text: plotModel.visibleNewtonIntercepts.map(pt => `x_${pt.i}`),
          textposition: "bottom center",
          color: "#16a34a",
          size: 10
        })
      )
    }

    return traces
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
    ...buildGuideTraces(plotModel),
    ...buildTangentTraces(plotModel),
    ...buildPointTraces(plotModel)
  ]
})(window)
