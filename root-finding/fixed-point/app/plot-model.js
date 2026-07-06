/**
 * Copyright (c) 2026 Apurva Nakade, Copilot. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade, Copilot
 */

/**
 * Derive fixed-point-specific plot inputs from the current result and step.
 */
(function attachFixedPointPlotModel(globalThis) {
  const plotModelUtils = globalThis.VisualMathPlotModelUtils
  const app = globalThis.VisualMathFixedPointAppParts || (globalThis.VisualMathFixedPointAppParts = {})

  app.buildPlotModel = ({result, stepControl, x0}) => {
    const visibleRows = plotModelUtils.sliceVisibleRows(result.rows, stepControl)
    const rangeValues = []
    plotModelUtils.pushFiniteValues(rangeValues, [Number(x0)])

    for (const row of visibleRows) {
      plotModelUtils.pushFiniteValues(rangeValues, [row.x, row.gx])
    }

    const range = plotModelUtils.createPaddedRange(rangeValues, {
      emptyRange: [-2, 2],
      singularPadding: 2,
      relativePadding: 0.45,
      minPadding: 1.0
    })

    return {
      visibleRows,
      range
    }
  }
})(window)
