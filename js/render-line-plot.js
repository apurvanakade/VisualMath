/**
 * Copyright (c) 2026 Apurva Nakade. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade
 */

(function attachVM(globalThis) {
  const SVG_NS = "http://www.w3.org/2000/svg"
  const WIDTH = 420
  const HEIGHT = 240
  const MARGIN = {top: 12, right: 16, bottom: 34, left: 44}

  const svgEl = (tag, attrs = {}) => {
    const el = document.createElementNS(SVG_NS, tag)
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
    return el
  }

  // Rounds a raw per-tick step up to a "nice" 1/2/5 * 10^n value.
  const niceStep = (lo, hi, count) => {
    const raw = Math.max(hi - lo, 1e-9) / count
    const mag = Math.pow(10, Math.floor(Math.log10(raw)))
    const norm = raw / mag
    return (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag
  }

  const ticksFor = (lo, hi, count = 5) => {
    if (lo === hi) return [lo]
    const step = niceStep(lo, hi, count)
    const ticks = []
    for (let v = Math.ceil(lo / step) * step; v <= hi + step / 1e6; v += step) {
      ticks.push(Math.round(v / step) * step)
    }
    return ticks
  }

  const formatTick = v => {
    const rounded = Object.is(v, -0) ? 0 : v
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")
  }

  const validPoints = s => {
    const pts = []
    for (let i = 0; i < s.x.length; i++) {
      if (Number.isFinite(s.x[i]) && Number.isFinite(s.y[i])) pts.push([s.x[i], s.y[i]])
    }
    return pts
  }

  /**
   * Renders a small, static line/scatter chart as an SVG — a lightweight
   * stand-in for Plotly when zoom/pan/hover interactivity isn't needed.
   *
   * @param {Object} opts
   * @param {string} [opts.title] - Title shown above the chart.
   * @param {string} [opts.xLabel] - X-axis label.
   * @param {string} [opts.yLabel] - Y-axis label.
   * @param {Array<{x: number[], y: (number|null)[], color?: string, name?: string, mode?: "markers+lines"|"markers"|"lines", dash?: boolean}>} opts.series
   * @returns {HTMLDivElement}
   */
  const renderLinePlot = ({title, xLabel, yLabel, series}) => {
    const allPts = series.flatMap(validPoints)
    const xRange = VM.paddedRange(allPts.map(p => p[0]), {relativePadding: 0.08, minPadding: 0.5})
    const yRange = VM.paddedRange(allPts.map(p => p[1]), {relativePadding: 0.12, minPadding: 0.5})

    const plotW = WIDTH - MARGIN.left - MARGIN.right
    const plotH = HEIGHT - MARGIN.top - MARGIN.bottom
    const sx = x => MARGIN.left + (x - xRange.lo) / (xRange.hi - xRange.lo) * plotW
    const sy = y => MARGIN.top + plotH - (y - yRange.lo) / (yRange.hi - yRange.lo) * plotH

    const svg = svgEl("svg", {
      viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
      preserveAspectRatio: "xMidYMid meet",
      style: "width:100%; height:100%; display:block"
    })

    // Gridlines + tick labels
    for (const t of ticksFor(yRange.lo, yRange.hi, 5)) {
      const y = sy(t)
      svg.append(svgEl("line", {x1: MARGIN.left, x2: WIDTH - MARGIN.right, y1: y, y2: y, stroke: "#e5e7eb", "stroke-width": 1}))
      const label = svgEl("text", {x: MARGIN.left - 6, y: y + 3.5, "text-anchor": "end", "font-size": 9, fill: "#6b7280"})
      label.textContent = formatTick(t)
      svg.append(label)
    }
    for (const t of ticksFor(xRange.lo, xRange.hi, 6)) {
      const x = sx(t)
      svg.append(svgEl("line", {x1: x, x2: x, y1: MARGIN.top, y2: HEIGHT - MARGIN.bottom, stroke: "#f1f5f9", "stroke-width": 1}))
      const label = svgEl("text", {x, y: HEIGHT - MARGIN.bottom + 14, "text-anchor": "middle", "font-size": 9, fill: "#6b7280"})
      label.textContent = formatTick(t)
      svg.append(label)
    }

    // Axis lines
    svg.append(svgEl("line", {x1: MARGIN.left, x2: MARGIN.left, y1: MARGIN.top, y2: HEIGHT - MARGIN.bottom, stroke: "#94a3b8", "stroke-width": 1}))
    svg.append(svgEl("line", {x1: MARGIN.left, x2: WIDTH - MARGIN.right, y1: HEIGHT - MARGIN.bottom, y2: HEIGHT - MARGIN.bottom, stroke: "#94a3b8", "stroke-width": 1}))

    // Axis titles
    if (xLabel) {
      const t = svgEl("text", {x: MARGIN.left + plotW / 2, y: HEIGHT - 4, "text-anchor": "middle", "font-size": 10, fill: "#374151"})
      t.textContent = xLabel
      svg.append(t)
    }
    if (yLabel) {
      const cy = MARGIN.top + plotH / 2
      const t = svgEl("text", {x: 10, y: cy, "text-anchor": "middle", "font-size": 10, fill: "#374151", transform: `rotate(-90 10 ${cy})`})
      t.textContent = yLabel
      svg.append(t)
    }

    // Data series
    for (const s of series) {
      const pts = validPoints(s)
      const mode = s.mode || "markers+lines"
      const color = s.color || "#2563eb"

      if (mode.includes("lines") && pts.length > 1) {
        const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${sx(x)},${sy(y)}`).join(" ")
        const path = svgEl("path", {d, fill: "none", stroke: color, "stroke-width": 2})
        if (s.dash) path.setAttribute("stroke-dasharray", "6,4")
        svg.append(path)
      }
      if (mode.includes("markers")) {
        for (const [x, y] of pts) {
          const circle = svgEl("circle", {cx: sx(x), cy: sy(y), r: 4, fill: color, stroke: "white", "stroke-width": 1})
          const tip = svgEl("title")
          tip.textContent = `${formatTick(x)}, ${formatTick(y)}`
          circle.append(tip)
          svg.append(circle)
        }
      }
    }

    const container = document.createElement("div")
    container.className = "vm-chart-box"

    if (title) {
      const heading = document.createElement("div")
      heading.className = "vm-chart-title"
      heading.textContent = title
      container.append(heading)
    }

    const svgWrap = document.createElement("div")
    svgWrap.className = "vm-chart-svg-wrap"
    svgWrap.append(svg)
    container.append(svgWrap)

    const namedSeries = series.filter(s => s.name)
    if (namedSeries.length > 0) {
      const legend = document.createElement("div")
      legend.className = "vm-chart-legend"
      for (const s of namedSeries) {
        const item = document.createElement("span")
        item.className = "vm-chart-legend-item"
        const swatch = document.createElement("span")
        swatch.className = "vm-chart-swatch"
        swatch.style.background = s.color || "#2563eb"
        item.append(swatch, document.createTextNode(s.name))
        legend.append(item)
      }
      container.append(legend)
    }

    return container
  }

  globalThis.VM = {...globalThis.VM, renderLinePlot}
})(window)
