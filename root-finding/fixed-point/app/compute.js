/**
 * Copyright (c) 2026 Apurva Nakade, Copilot. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade, Copilot
 */

/**
 * Compute fixed-point iterates from the page inputs.
 */
(function attachFixedPointCompute(globalThis) {
  const expressionUtils = globalThis.VisualMathExpressionUtils
  const app = globalThis.VisualMathFixedPointAppParts || (globalThis.VisualMathFixedPointAppParts = {})

  app.compute = ({mathjs, gText, x0, tolerance, maxIterations}) => {
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
        rows.push({
          i,
          x,
          gx,
          error: NaN
        })

        return {
          ok: false,
          statusType: "bad",
          message: `Iteration stopped because g(x_${i}) is not finite.`,
          rows,
          g
        }
      }

      const error = Math.abs(gx - x)

      rows.push({
        i,
        x,
        gx,
        error
      })

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
})(window)
