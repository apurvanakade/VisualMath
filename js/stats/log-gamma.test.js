/**
 * Copyright (c) 2026 Dhruv Azad. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Dhruv Azad
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { loadVM } from '../../scripts/load-vm.mjs'

const VM = loadVM()
const { logGamma } = VM.stats

test('logGamma matches log of integer factorials: Gamma(n) = (n-1)!', () => {
  assert.ok(Math.abs(Math.exp(logGamma(1)) - 1) < 1e-9)
  assert.ok(Math.abs(Math.exp(logGamma(5)) - 24) < 1e-8, `got ${Math.exp(logGamma(5))}`)
  assert.ok(Math.abs(Math.exp(logGamma(6)) - 120) < 1e-7)
})

test('logGamma(1/2) = log(sqrt(pi)) (uses the reflection branch)', () => {
  assert.ok(Math.abs(Math.exp(logGamma(0.5)) - Math.sqrt(Math.PI)) < 1e-10)
})

test('logGamma satisfies the recurrence Gamma(x+1) = x * Gamma(x)', () => {
  for (const x of [0.3, 1.5, 4.2, 9.9, 40]) {
    assert.ok(Math.abs(logGamma(x + 1) - (logGamma(x) + Math.log(x))) < 1e-10, `failed at x=${x}`)
  }
})

test('logGamma stays finite for the large arguments a big-sample test produces', () => {
  assert.ok(Number.isFinite(logGamma(5000)))
})
