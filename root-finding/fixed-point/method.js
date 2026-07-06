/**
 * Copyright (c) 2026 Apurva Nakade. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade
 */

/**
 * Fixed-point iteration in a notebook-style local file.
 */
(function attachFixedPointMethod(globalThis) {
  const expressionUtils = globalThis.VisualMathExpressionUtils
  const plotModelUtils = globalThis.VisualMathPlotModelUtils
  const tableUtils = globalThis.VisualMathRenderTableUtils
  const stepControlUtils = globalThis.VisualMathStepControlUtils

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
    const visibleRows = result.rows.slice(0, Math.min(Number(stepControl), result.rows.length) + 1)
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
      {
        x: xs,
        y: ys,
        type: "scatter",
        mode: "lines",
        name: "g(x)",
        showlegend: true,
        line: {
          color: "#2563eb",
          width: 3
        }
      },
      {
        x: [lo, hi],
        y: [lo, hi],
        type: "scatter",
        mode: "lines",
        name: "y = x",
        showlegend: true,
        line: {
          color: "#111827",
          width: 2,
          dash: "dash"
        }
      },
      {
        x: [lo, hi],
        y: [0, 0],
        type: "scatter",
        mode: "lines",
        name: "y = 0",
        showlegend: false,
        line: {
          color: "#94a3b8",
          width: 1
        }
      }
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
      {
        x: cobwebX,
        y: cobwebY,
        type: "scatter",
        mode: "lines+markers",
        name: "Cobweb path",
        showlegend: true,
        line: {
          color: "#dc2626",
          width: 2
        },
        marker: {
          color: "#dc2626",
          size: 7
        }
      },
      {
        x: plotModel.visibleRows.map(row => row.x).filter(Number.isFinite),
        y: plotModel.visibleRows.map(row => row.x).filter(Number.isFinite),
        type: "scatter",
        mode: "markers+text",
        name: "Iterates",
        text: plotModel.visibleRows
          .filter(row => Number.isFinite(row.x))
          .map(row => `x_${row.i}`),
        textposition: "top center",
        showlegend: true,
        marker: {
          color: "#16a34a",
          size: 9,
          symbol: "circle",
          line: {
            color: "white",
            width: 1
          }
        }
      }
    )

    return data
  }

  const renderTable = ({html, tex, rows}) => {
    if (rows.length === 0) {
      return html`<div class="ojs-status">No iterations to display yet.</div>`
    }

    return tableUtils.renderTable({
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
    const statusClass = `ojs-status ojs-status-${result.statusType}`

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
        <div class="${statusClass}"><strong>Status:</strong> ${result.message}</div>
        ${renderTable({html, tex, rows: plotModel.visibleRows})}
      </div>
    `
  }

  globalThis.VisualMathFixedPointMethod = {
    compute,
    createStepControl: options => stepControlUtils.createStepControl(options),
    renderOutput
  }
})(window)
