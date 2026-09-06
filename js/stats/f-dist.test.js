/**
 * Copyright (c) 2026 Dhruv Azad. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Dhruv Azad
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { loadVM } from '../../scripts/load-vm.mjs'

const VM = loadVM()
const { fDist, studentTDist } = VM.stats

test('equal degrees of freedom put the median at F = 1: cdf(1, d, d) = 1/2', () => {
  for (const d of [2, 5, 10, 40]) {
    assert.ok(Math.abs(fDist(1, d, d).cdf - 0.5) < 1e-10, `failed at d=${d}`)
  }
})

test('df = (1, 1): cdf(x) = (2/pi) * atan(sqrt(x))', () => {
  for (const x of [0.25, 1, 3, 9]) {
    assert.ok(
      Math.abs(fDist(x, 1, 1).cdf - (2 / Math.PI) * Math.atan(Math.sqrt(x))) < 1e-10,
      `failed at x=${x}`,
    )
  }
})

test('reciprocal identity: cdf_{F(d1,d2)}(x) = 1 - cdf_{F(d2,d1)}(1/x)', () => {
  for (const [x, d1, d2] of [[2, 4, 6], [0.3, 9, 3], [5.5, 12, 8]]) {
    assert.ok(
      Math.abs(fDist(x, d1, d2).cdf - (1 - fDist(1 / x, d2, d1).cdf)) < 1e-10,
      `failed at x=${x}, d1=${d1}, d2=${d2}`,
    )
  }
})

test('t(df)^2 is distributed as F(1, df): P(F <= t^2) = 2 * cdf_t(t) - 1', () => {
  for (const [t, df] of [[1.5, 8], [2.2, 20], [0.6, 5]]) {
    const fCdf = fDist(t * t, 1, df).cdf
    const fromT = 2 * studentTDist(t, df).cdf - 1
    assert.ok(Math.abs(fCdf - fromT) < 1e-10, `failed at t=${t}, df=${df}`)
  }
})

test('textbook 0.95 critical value: cdf(3.3258, 5, 10) approx 0.95; density integrates to 1', () => {
  assert.ok(Math.abs(fDist(3.3258, 5, 10).cdf - 0.95) < 1e-3, `got ${fDist(3.3258, 5, 10).cdf}`)
  let area = 0
  const dx = 0.005
  for (let x = dx / 2; x < 500; x += dx) area += fDist(x, 6, 8).pdf * dx
  assert.ok(Math.abs(area - 1) < 2e-3, `got ${area}`)
})
