/**
 * Copyright (c) 2026 Dhruv Azad. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Dhruv Azad
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { loadVM } from '../../scripts/load-vm.mjs'

const VM = loadVM()
const { studentTDist } = VM.stats

test('df = 1 is the standard Cauchy: cdf(t) = 1/2 + atan(t)/pi, pdf(t) = 1/(pi(1+t^2))', () => {
  for (const t of [-3, -0.7, 0, 1, 2.5]) {
    const { pdf, cdf } = studentTDist(t, 1)
    assert.ok(Math.abs(cdf - (0.5 + Math.atan(t) / Math.PI)) < 1e-10, `cdf failed at t=${t}`)
    assert.ok(Math.abs(pdf - 1 / (Math.PI * (1 + t * t))) < 1e-12, `pdf failed at t=${t}`)
  }
})

test('cdf(0) = 1/2 for every df, and the distribution is symmetric about 0', () => {
  for (const df of [1, 4, 30, 500]) {
    assert.ok(Math.abs(studentTDist(0, df).cdf - 0.5) < 1e-12, `cdf(0) failed at df=${df}`)
    assert.ok(Math.abs(studentTDist(-1.8, df).cdf - (1 - studentTDist(1.8, df).cdf)) < 1e-12, `symmetry failed at df=${df}`)
  }
})

test('large df approaches the standard normal: cdf(1.959964, 1e7) approx 0.975', () => {
  assert.ok(Math.abs(studentTDist(1.959964, 1e7).cdf - 0.975) < 1e-4, `got ${studentTDist(1.959964, 1e7).cdf}`)
})

test('classic critical values: cdf(2.228, 10) approx 0.975, cdf(3.169, 10) approx 0.995', () => {
  assert.ok(Math.abs(studentTDist(2.228, 10).cdf - 0.975) < 1e-3, `got ${studentTDist(2.228, 10).cdf}`)
  assert.ok(Math.abs(studentTDist(3.169, 10).cdf - 0.995) < 1e-3, `got ${studentTDist(3.169, 10).cdf}`)
})

test('density integrates to 1 (trapezoid over a wide window), df = 3', () => {
  let area = 0
  const dx = 0.005
  for (let t = -80; t < 80; t += dx) area += studentTDist(t, 3).pdf * dx
  assert.ok(Math.abs(area - 1) < 1e-3, `got ${area}`)
})
