/**
 * Copyright (c) 2026 Apurva Nakade, Copilot. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade, Copilot
 */

/**
 * Derive Newton-specific plot inputs from the current result and step.
 */
(function attachNewtonPlotModel(globalThis) {
  const plotModelUtils = globalThis.VisualMathPlotModelUtils
  const app = globalThis.VisualMathNewtonAppParts || (globalThis.VisualMathNewtonAppParts = {})

  app.buildPlotModel = ({result, stepControl, x0}) => {
    const visibleRows = plotModelUtils.sliceVisibleRows(result.rows, stepControl)
    const visibleNewtonPoints = []
    const visibleNewtonIntercepts = []

    for (const row of visibleRows) {
      if (Number.isFinite(row.x) && Number.isFinite(row.fx)) {
        visibleNewtonPoints.push({
          i: row.i,
          x: row.x,
          fx: row.fx,
          dfx: row.dfx,
          xNext: row.xNext
        })
      }

      if (Number.isFinite(row.xNext)) {
        visibleNewtonIntercepts.push({
          i: row.i + 1,
          x: row.xNext,
          y: 0
        })
      }
    }

    const xValues = []
    plotModelUtils.pushFiniteValues(xValues, [Number(x0)])

    for (const row of visibleRows) {
      plotModelUtils.pushFiniteValues(xValues, [row.x, row.xNext])
    }

    const xRange = plotModelUtils.createPaddedRange(xValues, {
      emptyRange: [-3, 3],
      singularPadding: 3,
      relativePadding: 0.45,
      minPadding: 1.0
    })

    const yValues = [0]
    plotModelUtils.appendSampledFunctionValues(yValues, result.f, {
      lo: xRange.lo,
      hi: xRange.hi,
      count: 400,
      maxAbs: 1e8
    })

    for (const row of visibleRows) {
      plotModelUtils.pushFiniteValues(yValues, [row.fx], {maxAbs: 1e8})

      if (
        Number.isFinite(row.x) &&
        Number.isFinite(row.fx) &&
        Number.isFinite(row.dfx) &&
        Number.isFinite(row.xNext)
      ) {
        const tlo = Math.max(xRange.lo, Math.min(row.x, row.xNext) - 0.75)
        const thi = Math.min(xRange.hi, Math.max(row.x, row.xNext) + 0.75)
        const y1 = row.fx + row.dfx * (tlo - row.x)
        const y2 = row.fx + row.dfx * (thi - row.x)

        plotModelUtils.pushFiniteValues(yValues, [y1, y2], {maxAbs: 1e8})
      }
    }

    const yRange = plotModelUtils.createPaddedRange(yValues, {
      emptyRange: [-1, 1],
      singularPadding: 1,
      relativePadding: 0.15,
      minPadding: 0.5
    })

    return {
      visibleRows,
      visibleNewtonPoints,
      visibleNewtonIntercepts,
      xRange,
      yRange
    }
  }
})(window)
