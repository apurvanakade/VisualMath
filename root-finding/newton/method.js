/**
 * Copyright (c) 2026 Apurva Nakade. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade
 */

(function attachNewtonMethod(globalThis) {
  const VM = globalThis.VM

  const compute = ({mathjs, fText, x0, tolerance, maxIterations}) => {
    const f = VM.makeFunction(mathjs, fText)
    const df = VM.makeDerivative(mathjs, fText)
    const fallback = x => NaN

    if (!f || !df) {
      return {ok: false, statusType: "bad", message: "Could not parse f(x) or compute its derivative. Try x^3 - x - 2 or cos(x) - x.", rows: [], f: fallback, df: fallback}
    }

    const rows = []
    const start = Number(x0)
    const tol = Number(tolerance)
    const maxIter = Number(maxIterations)

    if (!Number.isFinite(start)) {
      return {ok: false, statusType: "bad", message: "The initial guess x₀ must be a finite number.", rows: [], f, df}
    }

    let x = start
    for (let i = 0; i < maxIter; i++) {
      const fx = f(x)
      const dfx = df(x)

      if (!Number.isFinite(fx) || !Number.isFinite(dfx)) {
        rows.push({i, x, fx, dfx, xNext: NaN, error: NaN})
        return {ok: false, statusType: "bad", message: `Iteration stopped because f(x_${i}) or f'(x_${i}) is not finite.`, rows, f, df}
      }

      if (Math.abs(dfx) < 1e-14) {
        rows.push({i, x, fx, dfx, xNext: NaN, error: NaN})
        return {ok: false, statusType: "bad", message: `Iteration stopped because f'(x_${i}) is too close to zero.`, rows, f, df}
      }

      const xNext = x - fx / dfx
      const error = Math.abs(xNext - x)
      rows.push({i, x, fx, dfx, xNext, error})

      if (Math.abs(fx) < tol || error < tol) {
        return {ok: true, statusType: "good", message: `Converged after ${i + 1} iteration${i + 1 === 1 ? "" : "s"}. Approximate root: x ≈ ${xNext.toPrecision(10)}.`, rows, f, df}
      }

      x = xNext
    }

    return {ok: true, statusType: "warn", message: `Reached the maximum number of iterations. Last approximation: x ≈ ${x.toPrecision(10)}.`, rows, f, df}
  }

  const renderOutput = ({html, tex, Plotly, result, stepControl, x0}) => {
    const visibleRows = result.rows.slice(0, Math.min(Number(stepControl), result.rows.length) + 1)

    // x range
    const xValues = [Number(x0)]
    for (const row of visibleRows) VM.pushFiniteValues(xValues, [row.x, row.xNext])
    const xRange = VM.paddedRange(xValues, {emptyRange: [-3, 3], singularPadding: 3, relativePadding: 0.45, minPadding: 1.0})

    // sample f once for both the curve and the y range
    const N = 700
    const sampleXs = Array.from({length: N}, (_, i) => xRange.lo + (xRange.hi - xRange.lo) * i / (N - 1))
    const sampleYs = sampleXs.map(x => result.f(x)).map(y => Number.isFinite(y) && Math.abs(y) < 1e8 ? y : null)

    // y range
    const yValues = [0]
    VM.pushFiniteValues(yValues, sampleYs, {maxAbs: 1e8})
    for (const row of visibleRows) {
      VM.pushFiniteValues(yValues, [row.fx], {maxAbs: 1e8})
      if (Number.isFinite(row.x) && Number.isFinite(row.fx) && Number.isFinite(row.dfx) && Number.isFinite(row.xNext)) {
        const tlo = Math.max(xRange.lo, Math.min(row.x, row.xNext) - 0.75)
        const thi = Math.min(xRange.hi, Math.max(row.x, row.xNext) + 0.75)
        VM.pushFiniteValues(yValues, [row.fx + row.dfx * (tlo - row.x), row.fx + row.dfx * (thi - row.x)], {maxAbs: 1e8})
      }
    }
    const yRange = VM.paddedRange(yValues, {emptyRange: [-1, 1], singularPadding: 1, relativePadding: 0.15, minPadding: 0.5})

    // Plotly traces
    const data = [
      {x: sampleXs, y: sampleYs, type: "scatter", mode: "lines", name: "f(x)", showlegend: true, line: {color: "#2563eb", width: 3}},
      {x: [xRange.lo, xRange.hi], y: [0, 0], type: "scatter", mode: "lines", name: "y = 0", showlegend: true, line: {color: "#111827", width: 2}}
    ]

    const newtonPoints = visibleRows.filter(r => Number.isFinite(r.x) && Number.isFinite(r.fx))
    for (const r of newtonPoints) {
      data.push({x: [r.x, r.x], y: [0, r.fx], type: "scatter", mode: "lines", showlegend: false, hoverinfo: "skip", line: {color: "#94a3b8", width: 1.5, dash: "dot"}})
    }

    let tangentLegendShown = false
    for (const row of visibleRows) {
      if (!Number.isFinite(row.x) || !Number.isFinite(row.fx) || !Number.isFinite(row.dfx) || !Number.isFinite(row.xNext)) continue
      const tlo = Math.max(xRange.lo, Math.min(row.x, row.xNext) - 0.75)
      const thi = Math.min(xRange.hi, Math.max(row.x, row.xNext) + 0.75)
      data.push({
        x: [tlo, thi], y: [row.fx + row.dfx * (tlo - row.x), row.fx + row.dfx * (thi - row.x)],
        type: "scatter", mode: "lines", name: "Tangent lines", showlegend: !tangentLegendShown,
        line: {color: "#dc2626", width: 2.5, dash: "dash"}
      })
      tangentLegendShown = true
    }

    if (newtonPoints.length > 0) {
      data.push({
        x: newtonPoints.map(r => r.x), y: newtonPoints.map(r => r.fx),
        type: "scatter", mode: "markers+text", name: "Newton points",
        text: newtonPoints.map(r => `x_${r.i}`), textposition: "top center", showlegend: true,
        marker: {color: "#dc2626", size: 10, symbol: "circle", line: {color: "white", width: 1}}
      })
    }

    const intercepts = visibleRows.filter(r => Number.isFinite(r.xNext)).map(r => ({i: r.i + 1, x: r.xNext}))
    if (intercepts.length > 0) {
      data.push({
        x: intercepts.map(r => r.x), y: intercepts.map(() => 0),
        type: "scatter", mode: "markers+text", name: "Tangent x-intercepts",
        text: intercepts.map(r => `x_${r.i}`), textposition: "bottom center", showlegend: true,
        marker: {color: "#16a34a", size: 10, symbol: "circle", line: {color: "white", width: 1}}
      })
    }

    const plotDiv = html`<div class="plotly-box-large"></div>`
    Plotly.newPlot(plotDiv, data, {
      title: {text: "Newton's Method Tangent Visualization"},
      margin: {l: 65, r: 30, t: 60, b: 55},
      xaxis: {title: "x", range: [xRange.lo, xRange.hi], zeroline: true},
      yaxis: {title: "f(x)", range: [yRange.lo, yRange.hi], zeroline: true},
      legend: {orientation: "h", y: -0.18},
      hovermode: "closest"
    }, {responsive: true, displaylogo: false})

    const table = visibleRows.length === 0
      ? html`<div class="ojs-status">No iterations to display yet.</div>`
      : VM.renderTable({
          html,
          headers: ["n", tex`x_n`, tex`f(x_n)`, tex`f'(x_n)`, tex`x_{n+1}`, tex`|x_{n+1} - x_n|`],
          rows: visibleRows.map(row => [
            row.i,
            Number.isFinite(row.x) ? row.x.toPrecision(10) : "NaN",
            Number.isFinite(row.fx) ? row.fx.toExponential(5) : "NaN",
            Number.isFinite(row.dfx) ? row.dfx.toExponential(5) : "NaN",
            Number.isFinite(row.xNext) ? row.xNext.toPrecision(10) : "NaN",
            Number.isFinite(row.error) ? row.error.toExponential(4) : "NaN"
          ])
        })

    return html`<div>
      ${plotDiv}
      <div class="ojs-status ojs-status-${result.statusType}"><strong>Status:</strong> ${result.message}</div>
      ${table}
    </div>`
  }

  globalThis.VisualMathNewtonMethod = {compute, renderOutput}
})(window)
