/**
 * Copyright (c) 2026 Dhruv Azad. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Dhruv Azad
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { loadVM } from '../../scripts/load-vm.mjs'

const VM = loadVM()
const { chiSquareDist, regularizedGammaP } = VM.stats

test('df = 2 is Exponential with mean 2: cdf(x) = 1 - e^{-x/2}, pdf(x) = e^{-x/2}/2', () => {
  for (const x of [0.5, 2, 5, 11]) {
    const { pdf, cdf } = chiSquareDist(x, 2)
    assert.ok(Math.abs(cdf - (1 - Math.exp(-x / 2))) < 1e-12, `cdf failed at x=${x}`)
    assert.ok(Math.abs(pdf - Math.exp(-x / 2) / 2) < 1e-12, `pdf failed at x=${x}`)
  }
})

test('df = 1 cdf(x) = erf(sqrt(x/2)): cdf(1, 1) approx 0.6826894921', () => {
  assert.ok(Math.abs(chiSquareDist(1, 1).cdf - 0.6826894921) < 1e-8, `got ${chiSquareDist(1, 1).cdf}`)
})

test('cdf is exactly the regularized lower incomplete gamma P(df/2, x/2)', () => {
  for (const [x, df] of [[3, 1], [7.5, 4], [20, 15], [1, 2]]) {
    assert.ok(
      Math.abs(chiSquareDist(x, df).cdf - regularizedGammaP(df / 2, x / 2)) < 1e-14,
      `failed at x=${x}, df=${df}`,
    )
  }
})

test('textbook 0.95 critical values: cdf(3.841459, 1) and cdf(11.070, 5) approx 0.95', () => {
  assert.ok(Math.abs(chiSquareDist(3.841459, 1).cdf - 0.95) < 1e-4, `got ${chiSquareDist(3.841459, 1).cdf}`)
  assert.ok(Math.abs(chiSquareDist(11.0705, 5).cdf - 0.95) < 1e-3, `got ${chiSquareDist(11.0705, 5).cdf}`)
})

test('cdf(0) = 0, and the density integrates to 1 (trapezoid), df = 4', () => {
  assert.equal(chiSquareDist(0, 4).cdf, 0)
  let area = 0
  const dx = 0.005
  for (let x = dx / 2; x < 90; x += dx) area += chiSquareDist(x, 4).pdf * dx
  assert.ok(Math.abs(area - 1) < 1e-3, `got ${area}`)
})
