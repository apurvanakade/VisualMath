/**
 * Copyright (c) 2026 Apurva Nakade, Copilot. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade, Copilot
 */

/**
 * Compute Newton iterates from the page inputs.
 */
(function attachNewtonCompute(globalThis) {
  const expressionUtils = globalThis.VisualMathExpressionUtils
  const app = globalThis.VisualMathNewtonAppParts || (globalThis.VisualMathNewtonAppParts = {})

  app.compute = ({mathjs, fText, x0, tolerance, maxIterations}) => {
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
        rows.push({
          i,
          x,
          fx,
          dfx,
          xNext: NaN,
          error: NaN
        })

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
        rows.push({
          i,
          x,
          fx,
          dfx,
          xNext: NaN,
          error: NaN
        })

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

      rows.push({
        i,
        x,
        fx,
        dfx,
        xNext,
        error
      })

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
})(window)
