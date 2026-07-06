/**
 * Copyright (c) 2026 Apurva Nakade, Copilot. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade, Copilot
 */

/**
 * Newton's method in a notebook-style local file.
 *
 * The goal here is readability: keep the full mathematical flow in one place so
 * a contributor can read this top-to-bottom like a small notebook.
 */
(function attachNewtonMethod(globalThis) {
  const expressionUtils = globalThis.VisualMathExpressionUtils
  const plotModelUtils = globalThis.VisualMathPlotModelUtils
  const plotlyTraceUtils = globalThis.VisualMathPlotlyTraceUtils
  const renderUtils = globalThis.VisualMathRenderUtils

  const compute = ({mathjs, fText, x0, tolerance, maxIterations}) => {
    const compiledF = expressionUtils.tryCompileExpression(mathjs, fText)
    const compiledDF = expressionUtils.tryCompileDerivativeExpression(mathjs, fText)
    const f = x => expressionUtils.evaluateCompiledExpression(compiledF, {x})
    const df = x => expressionUtils.evaluateCompiledExpression(compiledDF, {x})
    const rows = []
    const start = Number(x0)
    const tol = Number(tolerance)
    const maxIter = Number(maxIterations)

    if (!compiledF || !compiledDF) {
      return {
        ok: false,
        statusType: "bad",
        message: "Could not parse f(x) or compute its derivative. Try an expression such as x^3 - x - 2 or cos(x) - x.",
        rows,
        f,
        df
      }
    }

    if (!Number.isFinite(start)) {
      return {
        ok: false,
        statusType: "bad",
        message: "The initial guess x₀ must be a finite number.",
        rows,
        f,
        df
      }
    }

    let x = start

    for (let i = 0; i < maxIter; i++) {
      const fx = f(x)
      const dfx = df(x)

      if (!Number.isFinite(fx) || !Number.isFinite(dfx)) {
        rows.push({i, x, fx, dfx, xNext: NaN, error: NaN})
        return {
          ok: false,
          statusType: "bad",
          message: `Iteration stopped because f(x_${i}) or f'(x_${i}) is not finite.`,
          rows,
          f,
          df
        }
      }

      if (Math.abs(dfx) < 1e-14) {
        rows.push({i, x, fx, dfx, xNext: NaN, error: NaN})
        return {
          ok: false,
          statusType: "bad",
          message: `Iteration stopped because f'(x_${i}) is too close to zero.`,
          rows,
          f,
          df
        }
      }

      const xNext = x - fx / dfx
      const error = Math.abs(xNext - x)

      rows.push({i, x, fx, dfx, xNext, error})

      if (Math.abs(fx) < tol || error < tol) {
        return {
          ok: true,
          statusType: "good",
          message: `Converged after ${i + 1} iteration${i + 1 === 1 ? "" : "s"}. Approximate root: x ≈ ${xNext.toPrecision(10)}.`,
          rows,
          f,
          df
        }
      }

      x = xNext
    }

    return {
      ok: true,
      statusType: "warn",
      message: `Reached the maximum number of iterations. Last approximation: x ≈ ${x.toPrecision(10)}.`,
      rows,
      f,
      df
    }
  }

  const buildPlotModel = ({result, stepControl, x0}) => {
    const visibleRows = plotModelUtils.sliceVisibleRows(result.rows, stepControl)
    const visibleNewtonPoints = []
    const visibleNewtonIntercepts = []

    for (const row of visibleRows) {
      if (Number.isFinite(row.x) && Number.isFinite(row.fx)) {
        visibleNewtonPoints.push({
          i: row.i,
          x: row.x,
          fx: row.fx
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

    return {visibleRows, visibleNewtonPoints, visibleNewtonIntercepts, xRange, yRange}
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

    for (const point of plotModel.visibleNewtonPoints) {
      data.push(
        plotlyTraceUtils.createLineTrace({
          x: [point.x, point.x],
          y: [0, point.fx],
          name: "Vertical guides",
          color: "#94a3b8",
          width: 1.5,
          dash: "dot",
          showlegend: false,
          hoverinfo: "skip"
        })
      )
    }

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

      const tlo = Math.max(xlo, Math.min(row.x, row.xNext) - 0.75)
      const thi = Math.min(xhi, Math.max(row.x, row.xNext) + 0.75)
      const tangentXs = [tlo, thi]
      const tangentYs = tangentXs.map(x => row.fx + row.dfx * (x - row.x))

      data.push(
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

    if (plotModel.visibleNewtonPoints.length > 0) {
      data.push(
        plotlyTraceUtils.createMarkerTrace({
          x: plotModel.visibleNewtonPoints.map(point => point.x),
          y: plotModel.visibleNewtonPoints.map(point => point.fx),
          name: "Newton points",
          text: plotModel.visibleNewtonPoints.map(point => `x_${point.i}`),
          textposition: "top center",
          color: "#dc2626",
          size: 10
        })
      )
    }

    if (plotModel.visibleNewtonIntercepts.length > 0) {
      data.push(
        plotlyTraceUtils.createMarkerTrace({
          x: plotModel.visibleNewtonIntercepts.map(point => point.x),
          y: plotModel.visibleNewtonIntercepts.map(point => point.y),
          name: "Tangent x-intercepts",
          text: plotModel.visibleNewtonIntercepts.map(point => `x_${point.i}`),
          textposition: "bottom center",
          color: "#16a34a",
          size: 10
        })
      )
    }

    return data
  }

  const renderTable = ({html, tex, rows}) => {
    if (rows.length === 0) {
      return renderUtils.renderEmptyState(html, "No iterations to display yet.")
    }

    return renderUtils.renderDataTable({
      html,
      headers: ["n", tex`x_n`, tex`f(x_n)`, tex`f'(x_n)`, tex`x_{n+1}`, tex`|x_{n+1} - x_n|`],
      rows: rows.map(row => [
        row.i,
        Number.isFinite(row.x) ? row.x.toPrecision(10) : "NaN",
        Number.isFinite(row.fx) ? row.fx.toExponential(5) : "NaN",
        Number.isFinite(row.dfx) ? row.dfx.toExponential(5) : "NaN",
        Number.isFinite(row.xNext) ? row.xNext.toPrecision(10) : "NaN",
        Number.isFinite(row.error) ? row.error.toExponential(4) : "NaN"
      ])
    })
  }

  const renderOutput = ({html, tex, Plotly, result, stepControl, x0}) => {
    const plotModel = buildPlotModel({result, stepControl, x0})
    const plotDiv = html`<div class="plotly-box-large"></div>`
    const data = buildPlotData({plotModel, result})

    Plotly.newPlot(plotDiv, data, {
      title: {text: "Newton's Method Tangent Visualization"},
      margin: {l: 65, r: 30, t: 60, b: 55},
      xaxis: {title: "x", range: [plotModel.xRange.lo, plotModel.xRange.hi], zeroline: true},
      yaxis: {title: "f(x)", range: [plotModel.yRange.lo, plotModel.yRange.hi], zeroline: true},
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

  globalThis.VisualMathNewtonMethod = {
    compute,
    createStepControl: options => renderUtils.createStepControl(options),
    renderOutput
  }
})(window)
