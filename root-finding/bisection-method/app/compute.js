/**
 * Copyright (c) 2026 Apurva Nakade, Copilot. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade, Copilot
 */

/**
 * Compute bisection iterates from the page inputs.
 */
(function attachBisectionCompute(globalThis) {
  const expressionUtils = globalThis.VisualMathExpressionUtils
  const app = globalThis.VisualMathBisectionAppParts || (globalThis.VisualMathBisectionAppParts = {})

  app.compute = ({mathjs, fText, a0, b0, tolerance, maxIterations}) => {
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

      rows.push({
        n,
        a,
        b,
        m,
        fa,
        fb,
        fm,
        width: b - a
      })

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
})(window)
