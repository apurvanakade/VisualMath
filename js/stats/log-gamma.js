/**
 * Copyright (c) 2026 Dhruv Azad. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Dhruv Azad
 */

(function attachVM(globalThis) {
  // Natural log of the gamma function, via the Lanczos approximation
  // (g = 7, 9 coefficients). Working in log space keeps the t / F / chi-square
  // density normalizers finite for the large degrees of freedom a big sample
  // produces -- Gamma(n/2) itself overflows a double well before n = 350.
  const G = 7;
  const COEFFICIENTS = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  const logGamma = (x) => {
    // Reflection formula for the left half-line, where the Lanczos series
    // isn't valid: Gamma(x) * Gamma(1 - x) = pi / sin(pi * x).
    if (x < 0.5) {
      return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
    }

    const z = x - 1;
    let series = COEFFICIENTS[0];
    for (let i = 1; i < G + 2; i++) {
      series += COEFFICIENTS[i] / (z + i);
    }
    const t = z + G + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(series);
  };

  globalThis.VM = { ...globalThis.VM, stats: { ...globalThis.VM?.stats, logGamma } };
})(window);
