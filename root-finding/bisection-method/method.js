/**
 * Copyright (c) 2026 Apurva Nakade. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade
 */

(function attachBisectionMethod(globalThis) {
  const VM = globalThis.VM

  const compute = ({mathjs, fText, a0, b0, tolerance, maxIterations}) => {
    const f = VM.makeFunction(mathjs, fText)
    const fallback = x => NaN

    if (!f) {
      return {ok: false, statusType: "bad", message: "Could not parse the function. Try x^3 - x - 2, cos(x) - x, or exp(-x) - x.", rows: [], f: fallback}
    }

    let a = Number(a0)
    let b = Number(b0)
    const tol = Number(tolerance)
    const maxIter = Number(maxIterations)

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return {ok: false, statusType: "bad", message: "The endpoints must be finite numbers.", rows: [], f}
    }

    if (a === b) {
      return {ok: false, statusType: "bad", message: "The endpoints a and b must be different.", rows: [], f}
    }

    if (a > b) { const tmp = a; a = b; b = tmp }

    const fa = f(a)
    const fb = f(b)

    if (!Number.isFinite(fa) || !Number.isFinite(fb)) {
      return {ok: false, statusType: "bad", message: "Could not evaluate f(a) or f(b). Check the function and interval.", rows: [], f}
    }

    if (fa === 0) {
      return {ok: true, statusType: "good", message: `The left endpoint a = ${a} is already a root.`, rows: [{n: 0, a, b, m: a, fa, fb, fm: fa, width: b - a}], f}
    }

    if (fb === 0) {
      return {ok: true, statusType: "good", message: `The right endpoint b = ${b} is already a root.`, rows: [{n: 0, a, b, m: b, fa, fb, fm: fb, width: b - a}], f}
    }

    if (fa * fb > 0) {
      return {ok: false, statusType: "bad", message: `Bisection requires f(a) and f(b) to have opposite signs. Here f(a) = ${fa.toPrecision(6)} and f(b) = ${fb.toPrecision(6)}.`, rows: [], f}
    }

    const rows = []
    let curA = a, curB = b, curFa = fa, curFb = fb
    for (let n = 0; n <= maxIter; n++) {
      const m = 0.5 * (curA + curB)
      const fm = f(m)
      rows.push({n, a: curA, b: curB, m, fa: curFa, fb: curFb, fm, width: curB - curA})

      if (!Number.isFinite(fm)) {
        return {ok: false, statusType: "bad", message: `Stopped because f(m) is not finite at step ${n}.`, rows, f}
      }

      if (Math.abs(fm) < tol || Math.abs(curB - curA) < tol) {
        return {ok: true, statusType: "good", message: `Converged after ${n + 1} iteration${n + 1 === 1 ? "" : "s"}. Approximate root: m ≈ ${m.toPrecision(10)}.`, rows, f}
      }

      if (curFa * fm < 0) { curB = m; curFb = fm } else { curA = m; curFa = fm }
    }

    const last = rows[rows.length - 1]
    return {ok: true, statusType: "warn", message: `Reached the maximum number of iterations. Last midpoint: m ≈ ${last.m.toPrecision(10)}, interval width = ${last.width.toExponential(3)}.`, rows, f}
  }

  const renderOutput = ({html, tex, Plotly, result, stepControl, a0, b0}) => {
    const visibleRows = result.rows.slice(0, Math.min(Number(stepControl), result.rows.length) + 1)
    const currentRow = visibleRows.length === 0 ? null : visibleRows[visibleRows.length - 1]

    // x range
    const xValues = [Number(a0), Number(b0)]
    for (const row of visibleRows) VM.pushFiniteValues(xValues, [row.a, row.b, row.m])
    const xRange = VM.paddedRange(xValues, {emptyRange: [-5, 5], singularPadding: 2, relativePadding: 0.25, minPadding: 0.5})

    // sample f once for both the curve and y range
    const N = 700
    const sampleXs = Array.from({length: N}, (_, i) => xRange.lo + (xRange.hi - xRange.lo) * i / (N - 1))
    const sampleYs = sampleXs.map(x => result.f(x)).map(y => Number.isFinite(y) && Math.abs(y) < 1e8 ? y : null)

    // y range
    const yValues = [0]
    VM.pushFiniteValues(yValues, sampleYs, {maxAbs: 1e8})
    for (const row of visibleRows) VM.pushFiniteValues(yValues, [row.fa, row.fb, row.fm], {maxAbs: 1e8})
    const yRange = VM.paddedRange(yValues, {emptyRange: [-1, 1], singularPadding: 1, relativePadding: 0.15, minPadding: 0.5})

    // Plotly traces
    const data = [
      {x: sampleXs, y: sampleYs, type: "scatter", mode: "lines", name: "f(x)", showlegend: true, line: {color: "#2563eb", width: 3}},
      {x: [xRange.lo, xRange.hi], y: [0, 0], type: "scatter", mode: "lines", name: "y = 0", showlegend: true, line: {color: "#111827", width: 2}}
    ]

    if (currentRow) {
      const row = currentRow
      data.push(
        {x: [row.a, row.b], y: [row.fa, row.fb], type: "scatter", mode: "markers+text", name: "Endpoints",
          text: ["a", "b"], textposition: "top center", showlegend: true,
          marker: {color: "#2563eb", size: 11, symbol: "circle", line: {color: "white", width: 1}}},
        {x: [row.m], y: [row.fm], type: "scatter", mode: "markers+text", name: "Midpoint",
          text: ["m"], textposition: "top center", showlegend: true,
          marker: {color: "#dc2626", size: 13, symbol: "circle", line: {color: "white", width: 1}}},
        {x: [row.a, row.a], y: [0, row.fa], type: "scatter", mode: "lines", showlegend: false, hoverinfo: "skip", line: {color: "#94a3b8", width: 1.5, dash: "dot"}},
        {x: [row.b, row.b], y: [0, row.fb], type: "scatter", mode: "lines", showlegend: false, hoverinfo: "skip", line: {color: "#94a3b8", width: 1.5, dash: "dot"}},
        {x: [row.m, row.m], y: [0, row.fm], type: "scatter", mode: "lines", showlegend: false, hoverinfo: "skip", line: {color: "#dc2626", width: 1.5, dash: "dot"}}
      )
    }

    const shapes = currentRow ? [{
      type: "rect", xref: "x", yref: "paper",
      x0: currentRow.a, x1: currentRow.b, y0: 0, y1: 1,
      fillcolor: "rgba(37, 99, 235, 0.14)", line: {width: 0}
    }] : []

    const plotDiv = html`<div class="plotly-box-large"></div>`
    Plotly.newPlot(plotDiv, data, {
      title: {text: "Bisection Method"},
      margin: {l: 65, r: 30, t: 60, b: 55},
      xaxis: {title: "x", range: [xRange.lo, xRange.hi], zeroline: true},
      yaxis: {title: "f(x)", range: [yRange.lo, yRange.hi], zeroline: true},
      shapes,
      legend: {orientation: "h", y: -0.18},
      hovermode: "closest"
    }, {responsive: true, displaylogo: false})

    const table = visibleRows.length === 0
      ? html`<div class="ojs-status">No iterations to display yet.</div>`
      : VM.renderTable({
          html,
          headers: ["n", tex`a_n`, tex`b_n`, tex`m_n`, tex`f(a_n)`, tex`f(b_n)`, tex`f(m_n)`, "width"],
          rows: visibleRows.map(row => [
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

    return html`<div>
      ${plotDiv}
      <div class="ojs-status ojs-status-${result.statusType}"><strong>Status:</strong> ${result.message}</div>
      ${table}
    </div>`
  }

  globalThis.VisualMathBisectionMethod = {compute, renderOutput}
})(window)
