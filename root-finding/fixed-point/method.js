/**
 * Copyright (c) 2026 Apurva Nakade, Copilot. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade, Copilot
 */

/**
 * Fixed-point iteration in a notebook-style local file.
 */
(function attachFixedPointMethod(globalThis) {
  const expressionUtils = globalThis.VisualMathExpressionUtils
  const plotModelUtils = globalThis.VisualMathPlotModelUtils
  const plotlyTraceUtils = globalThis.VisualMathPlotlyTraceUtils
  const renderUtils = globalThis.VisualMathRenderUtils

  const compute = ({mathjs, gText, x0, tolerance, maxIterations}) => {
    const compiledG = expressionUtils.tryCompileExpression(mathjs, gText)
    const g = x => expressionUtils.evaluateCompiledExpression(compiledG, {x})
    const rows = []
    const start = Number(x0)
    const tol = Number(tolerance)
    const maxIter = Number(maxIterations)

    if (!compiledG) {
      return {
        ok: false,
        statusType: "bad",
        message: "Could not parse g(x). Try an expression such as cos(x), exp(-x), or sqrt(x + 2).",
        rows,
        g
      }
    }

    if (!Number.isFinite(start)) {
      return {
        ok: false,
        statusType: "bad",
        message: "The initial guess x₀ must be a finite number.",
        rows,
        g
      }
    }

    let x = start
    for (let i = 0; i < maxIter; i++) {
      const gx = g(x)

      if (!Number.isFinite(gx)) {
        rows.push({i, x, gx, error: NaN})
        return {
          ok: false,
          statusType: "bad",
          message: `Iteration stopped because g(x_${i}) is not finite.`,
          rows,
          g
        }
      }

      const error = Math.abs(gx - x)
      rows.push({i, x, gx, error})

      if (error < tol) {
        return {
          ok: true,
          statusType: "good",
          message: `Converged after ${i + 1} iteration${i + 1 === 1 ? "" : "s"}. Approximate fixed point: x ≈ ${gx.toPrecision(10)}.`,
          rows,
          g
        }
      }

      x = gx
    }

    return {
      ok: true,
      statusType: "warn",
      message: `Reached the maximum number of iterations. Last approximation: x ≈ ${x.toPrecision(10)}.`,
      rows,
      g
    }
  }

  const buildPlotModel = ({result, stepControl, x0}) => {
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

    return {visibleRows, range}
  }

  const buildPlotData = ({plotModel, result, x0}) => {
    const lo = plotModel.range.lo
    const hi = plotModel.range.hi
    const xs = Array.from({length: 500}, (_, i) => lo + (hi - lo) * i / 499)
    const ys = xs.map(x => result.g(x)).map(y => Number.isFinite(y) ? y : null)

    const data = [
      plotlyTraceUtils.createLineTrace({
        x: xs,
        y: ys,
        name: "g(x)",
        color: "#2563eb",
        width: 3
      }),
      plotlyTraceUtils.createLineTrace({
        x: [lo, hi],
        y: [lo, hi],
        name: "y = x",
        color: "#111827",
        width: 2,
        dash: "dash"
      }),
      plotlyTraceUtils.createLineTrace({
        x: [lo, hi],
        y: [0, 0],
        name: "y = 0",
        color: "#94a3b8",
        width: 1,
        showlegend: false
      })
    ]

    if (plotModel.visibleRows.length === 0) {
      return data
    }

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

    data.push(
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
      }),
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
    )

    return data
  }

  const renderTable = ({html, tex, rows}) => {
    if (rows.length === 0) {
      return renderUtils.renderEmptyState(html, "No iterations to display yet.")
    }

    return renderUtils.renderDataTable({
      html,
      headers: ["n", "x_n", tex`g(x_n) = x_{n+1}`, tex`|x_{n+1} - x_n|`],
      rows: rows.map(row => [
        row.i,
        Number.isFinite(row.x) ? row.x.toPrecision(10) : "NaN",
        Number.isFinite(row.gx) ? row.gx.toPrecision(10) : "NaN",
        Number.isFinite(row.error) ? row.error.toExponential(4) : "NaN"
      ])
    })
  }

  const renderOutput = ({html, tex, Plotly, result, stepControl, x0}) => {
    const plotModel = buildPlotModel({result, stepControl, x0})
    const plotDiv = html`<div class="plotly-box-large"></div>`

    Plotly.newPlot(plotDiv, buildPlotData({plotModel, result, x0}), {
      title: {text: "Fixed Point Iteration Cobweb Diagram"},
      margin: {l: 60, r: 30, t: 60, b: 55},
      xaxis: {title: "x", range: [plotModel.range.lo, plotModel.range.hi], zeroline: true},
      yaxis: {
        title: "y",
        range: [plotModel.range.lo, plotModel.range.hi],
        zeroline: true,
        zerolinecolor: "#94a3b8",
        gridcolor: "#e2e8f0",
        linecolor: "#cbd5e1"
      },
      legend: {orientation: "h", y: -0.18},
      hovermode: "closest"
    }, {
      responsive: true,
      displaylogo: false
    })

    return html`
      <div>
        ${plotDiv}
        ${renderUtils.renderStatusBox({
          html,
          statusType: result.statusType,
          message: result.message
        })}
        ${renderTable({html, tex, rows: plotModel.visibleRows})}
      </div>
    `
  }

  globalThis.VisualMathFixedPointMethod = {
    compute,
    createStepControl: options => renderUtils.createStepControl(options),
    renderOutput
  }
})(window)
