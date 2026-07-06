/**
 * Copyright (c) 2026 Apurva Nakade. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade
 */

(function attachFixedPointMethod(globalThis) {
  const VM = globalThis.VM

  const compute = ({mathjs, gText, x0, tolerance, maxIterations}) => {
    const g = VM.makeFunction(mathjs, gText)
    const fallback = x => NaN

    if (!g) {
      return {ok: false, statusType: "bad", message: "Could not parse g(x). Try cos(x), exp(-x), or sqrt(x + 2).", rows: [], g: fallback}
    }

    const rows = []
    const start = Number(x0)
    const tol = Number(tolerance)
    const maxIter = Number(maxIterations)

    if (!Number.isFinite(start)) {
      return {ok: false, statusType: "bad", message: "The initial guess x₀ must be a finite number.", rows: [], g}
    }

    let x = start
    for (let i = 0; i < maxIter; i++) {
      const gx = g(x)

      if (!Number.isFinite(gx)) {
        rows.push({i, x, gx, error: NaN})
        return {ok: false, statusType: "bad", message: `Iteration stopped because g(x_${i}) is not finite.`, rows, g}
      }

      const error = Math.abs(gx - x)
      rows.push({i, x, gx, error})

      if (error < tol) {
        return {ok: true, statusType: "good", message: `Converged after ${i + 1} iteration${i + 1 === 1 ? "" : "s"}. Approximate fixed point: x ≈ ${gx.toPrecision(10)}.`, rows, g}
      }

      x = gx
    }

    return {ok: true, statusType: "warn", message: `Reached the maximum number of iterations. Last approximation: x ≈ ${x.toPrecision(10)}.`, rows, g}
  }

  const renderOutput = ({html, tex, Plotly, result, stepControl, x0}) => {
    const visibleRows = result.rows.slice(0, Math.min(Number(stepControl), result.rows.length) + 1)

    // single square range for both axes (cobweb diagram)
    const rangeValues = [Number(x0)]
    for (const row of visibleRows) VM.pushFiniteValues(rangeValues, [row.x, row.gx])
    const range = VM.paddedRange(rangeValues, {emptyRange: [-2, 2], singularPadding: 2, relativePadding: 0.45, minPadding: 1.0})

    // sample g across the range
    const N = 500
    const xs = Array.from({length: N}, (_, i) => range.lo + (range.hi - range.lo) * i / (N - 1))
    const ys = xs.map(x => result.g(x)).map(y => Number.isFinite(y) ? y : null)

    // Plotly traces
    const data = [
      {x: xs, y: ys, type: "scatter", mode: "lines", name: "g(x)", showlegend: true, line: {color: "#2563eb", width: 3}},
      {x: [range.lo, range.hi], y: [range.lo, range.hi], type: "scatter", mode: "lines", name: "y = x", showlegend: true, line: {color: "#111827", width: 2, dash: "dash"}},
      {x: [range.lo, range.hi], y: [0, 0], type: "scatter", mode: "lines", showlegend: false, line: {color: "#94a3b8", width: 1}}
    ]

    if (visibleRows.length > 0) {
      const cobwebX = []
      const cobwebY = []
      const start = Number(x0)
      if (Number.isFinite(start)) { cobwebX.push(start); cobwebY.push(start) }
      for (const row of visibleRows) {
        if (!Number.isFinite(row.x) || !Number.isFinite(row.gx)) continue
        cobwebX.push(row.x, row.gx)
        cobwebY.push(row.gx, row.gx)
      }

      data.push(
        {x: cobwebX, y: cobwebY, type: "scatter", mode: "lines+markers", name: "Cobweb path", showlegend: true,
          line: {color: "#dc2626", width: 2}, marker: {color: "#dc2626", size: 7}},
        {
          x: visibleRows.map(r => r.x).filter(Number.isFinite),
          y: visibleRows.map(r => r.x).filter(Number.isFinite),
          type: "scatter", mode: "markers+text", name: "Iterates", showlegend: true,
          text: visibleRows.filter(r => Number.isFinite(r.x)).map(r => `x_${r.i}`),
          textposition: "top center",
          marker: {color: "#16a34a", size: 9, symbol: "circle", line: {color: "white", width: 1}}
        }
      )
    }

    const plotDiv = html`<div class="plotly-box-large"></div>`
    Plotly.newPlot(plotDiv, data, {
      title: {text: "Fixed Point Iteration Cobweb Diagram"},
      margin: {l: 60, r: 30, t: 60, b: 55},
      xaxis: {title: "x", range: [range.lo, range.hi], zeroline: true},
      yaxis: {title: "y", range: [range.lo, range.hi], zeroline: true, zerolinecolor: "#94a3b8", gridcolor: "#e2e8f0", linecolor: "#cbd5e1"},
      legend: {orientation: "h", y: -0.18},
      hovermode: "closest"
    }, {responsive: true, displaylogo: false})

    const table = visibleRows.length === 0
      ? html`<div class="ojs-status">No iterations to display yet.</div>`
      : VM.renderTable({
          html,
          headers: ["n", "x_n", tex`g(x_n) = x_{n+1}`, tex`|x_{n+1} - x_n|`],
          rows: visibleRows.map(row => [
            row.i,
            Number.isFinite(row.x) ? row.x.toPrecision(10) : "NaN",
            Number.isFinite(row.gx) ? row.gx.toPrecision(10) : "NaN",
            Number.isFinite(row.error) ? row.error.toExponential(4) : "NaN"
          ])
        })

    return html`<div>
      ${plotDiv}
      <div class="ojs-status ojs-status-${result.statusType}"><strong>Status:</strong> ${result.message}</div>
      ${table}
    </div>`
  }

  globalThis.VisualMathFixedPointMethod = {compute, renderOutput}
})(window)
