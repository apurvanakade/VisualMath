/**
 * Copyright (c) 2026 Apurva Nakade, Copilot. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade, Copilot
 */

/**
 * Derive bisection-specific plot inputs from the current result and step.
 */
(function attachBisectionPlotModel(globalThis) {
  const plotModelUtils = globalThis.VisualMathPlotModelUtils
  const app = globalThis.VisualMathBisectionAppParts || (globalThis.VisualMathBisectionAppParts = {})

  app.buildPlotModel = ({result, stepControl, a0, b0}) => {
    const visibleRows = plotModelUtils.sliceVisibleRows(result.rows, stepControl)
    const currentBisectionRow = visibleRows.length === 0 ? null : visibleRows[visibleRows.length - 1]

    const xValues = []
    plotModelUtils.pushFiniteValues(xValues, [Number(a0), Number(b0)])

    for (const row of visibleRows) {
      plotModelUtils.pushFiniteValues(xValues, [row.a, row.b, row.m])
    }

    const xRange = plotModelUtils.createPaddedRange(xValues, {
      emptyRange: [-5, 5],
      singularPadding: 2,
      relativePadding: 0.25,
      minPadding: 0.5
    })

    const yValues = [0]
    plotModelUtils.appendSampledFunctionValues(yValues, result.f, {
      lo: xRange.lo,
      hi: xRange.hi,
      count: 500,
      maxAbs: 1e8
    })

    for (const row of visibleRows) {
      plotModelUtils.pushFiniteValues(yValues, [row.fa, row.fb, row.fm], {maxAbs: 1e8})
    }

    const yRange = plotModelUtils.createPaddedRange(yValues, {
      emptyRange: [-1, 1],
      singularPadding: 1,
      relativePadding: 0.15,
      minPadding: 0.5
    })

    return {
      visibleRows,
      currentBisectionRow,
      xRange,
      yRange
    }
  }
})(window)
