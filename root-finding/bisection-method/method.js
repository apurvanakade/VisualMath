/**
 * Copyright (c) 2026 Apurva Nakade. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade
 */

/**
 * Bisection method in a notebook-style local file.
 */
(function attachBisectionMethod(globalThis) {
  const expressionUtils = globalThis.VisualMathExpressionUtils
  const plotModelUtils = globalThis.VisualMathPlotModelUtils
  const plotlyTraceUtils = globalThis.VisualMathPlotlyTraceUtils
  const renderUtils = globalThis.VisualMathRenderUtils

  const compute = ({mathjs, fText, a0, b0, tolerance, maxIterations}) => {
    const compiledF = expressionUtils.tryCompileExpression(mathjs, fText)
    const f = x => expressionUtils.evaluateCompiledExpression(compiledF, {x})
    let a = Number(a0)
    let b = Number(b0)
    const tol = Number(tolerance)
    const maxIter = Number(maxIterations)

    if (!compiledF) {
      return {
        valid: false,
        statusType: "bad",
        message: "Could not parse the function. Try x^3 - x - 2, cos(x) - x, or exp(-x) - x.",
        rows: [],
        f
      }
    }

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return {
        valid: false,
        statusType: "bad",
        message: "The endpoints must be finite numbers.",
        rows: [],
        f
      }
    }

    if (a === b) {
      return {
        valid: false,
        statusType: "bad",
        message: "The endpoints a and b must be different.",
        rows: [],
        f
      }
    }

    if (a > b) {
      const temp = a
      a = b
      b = temp
    }

    let fa = f(a)
    let fb = f(b)

    if (!Number.isFinite(fa) || !Number.isFinite(fb)) {
      return {
        valid: false,
        statusType: "bad",
        message: "Could not evaluate f(a) or f(b). Check the function and interval.",
        rows: [],
        f
      }
    }

    if (fa === 0) {
      return {
        valid: true,
        statusType: "good",
        message: `The left endpoint a = ${a} is already a root.`,
        rows: [{n: 0, a, b, m: a, fa, fb, fm: fa, width: b - a}],
        f
      }
    }

    if (fb === 0) {
      return {
        valid: true,
        statusType: "good",
        message: `The right endpoint b = ${b} is already a root.`,
        rows: [{n: 0, a, b, m: b, fa, fb, fm: fb, width: b - a}],
        f
      }
    }

    if (fa * fb > 0) {
      return {
        valid: false,
        statusType: "bad",
        message: `Bisection requires f(a) and f(b) to have opposite signs. Here f(a) = ${fa.toPrecision(6)} and f(b) = ${fb.toPrecision(6)}.`,
        rows: [],
        f
      }
    }

    const rows = []
    for (let n = 0; n <= maxIter; n++) {
      const m = 0.5 * (a + b)
      const fm = f(m)

      rows.push({n, a, b, m, fa, fb, fm, width: b - a})

      if (!Number.isFinite(fm)) {
        return {
          valid: false,
          statusType: "bad",
          message: `Stopped because f(m) is not finite at step ${n}.`,
          rows,
          f
        }
      }

      if (Math.abs(fm) < tol || Math.abs(b - a) < tol) {
        const last = rows[rows.length - 1]
        return {
          valid: true,
          statusType: "good",
          message: `Converged after ${n + 1} iteration${n + 1 === 1 ? "" : "s"}. Approximate root: m ≈ ${last.m.toPrecision(10)}.`,
          rows,
          f
        }
      }

      if (fa * fm < 0) {
        b = m
        fb = fm
      } else {
        a = m
        fa = fm
      }
    }

    const last = rows[rows.length - 1]
    return {
      valid: true,
      statusType: "warn",
      message: `Reached the maximum number of iterations. Last midpoint: m ≈ ${last.m.toPrecision(10)}, interval width = ${last.width.toExponential(3)}.`,
      rows,
      f
    }
  }

  const buildPlotModel = ({result, stepControl, a0, b0}) => {
    const visibleRows = plotModelUtils.sliceVisibleRows(result.rows, stepControl)
    const currentRow = visibleRows.length === 0 ? null : visibleRows[visibleRows.length - 1]

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

    return {visibleRows, currentRow, xRange, yRange}
  }

  const buildPlotData = ({plotModel, result}) => {
    const xlo = plotModel.xRange.lo
    const xhi = plotModel.xRange.hi
    const xs = Array.from({length: 700}, (_, i) => xlo + (xhi - xlo) * i / 699)
    const ys = xs.map(x => result.f(x)).map(y => Number.isFinite(y) && Math.abs(y) < 1e8 ? y : null)

    const data = [
      plotlyTraceUtils.createLineTrace({
        x: xs,
        y: ys,
        name: "f(x)",
        color: "#2563eb",
        width: 3
      }),
      plotlyTraceUtils.createLineTrace({
        x: [xlo, xhi],
        y: [0, 0],
        name: "y = 0",
        color: "#111827",
        width: 2
      })
    ]

    if (!plotModel.currentRow) {
      return data
    }

    const row = plotModel.currentRow
    data.push(
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
      }),
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
    )

    return data
  }

  const renderTable = ({html, tex, rows}) => {
    if (rows.length === 0) {
      return renderUtils.renderEmptyState(html, "No iterations to display yet.")
    }

    return renderUtils.renderDataTable({
      html,
      headers: ["n", tex`a_n`, tex`b_n`, tex`m_n`, tex`f(a_n)`, tex`f(b_n)`, tex`f(m_n)`, "width"],
      rows: rows.map(row => [
        row.n,
        Number.isFinite(row.a) ? row.a.toPrecision(10) : "NaN",
        Number.isFinite(row.b) ? row.b.toPrecision(10) : "NaN",
        Number.isFinite(row.m) ? row.m.toPrecision(10) : "NaN",
        Number.isFinite(row.fa) ? row.fa.toExponential(5) : "NaN",
        Number.isFinite(row.fb) ? row.fb.toExponential(5) : "NaN",
        Number.isFinite(row.fm) ? row.fm.toExponential(5) : "NaN",
        Number.isFinite(row.width) ? row.width.toExponential(4) : "NaN"
      ])
    })
  }

  const renderOutput = ({html, tex, Plotly, result, stepControl, a0, b0}) => {
    const plotModel = buildPlotModel({result, stepControl, a0, b0})
    const plotDiv = html`<div class="plotly-box-large"></div>`
    const shapes = plotModel.currentRow ? [{
      type: "rect",
      xref: "x",
      yref: "paper",
      x0: plotModel.currentRow.a,
      x1: plotModel.currentRow.b,
      y0: 0,
      y1: 1,
      fillcolor: "rgba(37, 99, 235, 0.14)",
      line: {width: 0}
    }] : []

    Plotly.newPlot(plotDiv, buildPlotData({plotModel, result}), {
      title: {text: "Bisection Method"},
      margin: {l: 65, r: 30, t: 60, b: 55},
      xaxis: {title: "x", range: [plotModel.xRange.lo, plotModel.xRange.hi], zeroline: true},
      yaxis: {title: "f(x)", range: [plotModel.yRange.lo, plotModel.yRange.hi], zeroline: true},
      shapes,
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

  globalThis.VisualMathBisectionMethod = {
    compute,
    createStepControl: options => renderUtils.createStepControl(options),
    renderOutput
  }
})(window)
