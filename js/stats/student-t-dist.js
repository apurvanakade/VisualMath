/**
 * Copyright (c) 2026 Dhruv Azad. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Dhruv Azad
 */

(function attachVM(globalThis) {
  // Student's t distribution with `df` degrees of freedom, evaluated at `t`.
  // Returns { pdf, cdf } -- the density for drawing the curve, and the
  // left-tail probability P(T <= t) for reading a p-value off it.
  //
  // The CDF is written through the regularized incomplete beta function:
  // with x = df / (df + t^2), P(T <= t) is 1 - 0.5 * I_x(df/2, 1/2) for
  // t > 0, and 0.5 * I_x(df/2, 1/2) for t <= 0 (the split keeps x in
  // [0, 1] and uses the distribution's symmetry about 0).
  const studentTDist = (t, df) => {
    if (!(df > 0) || Number.isNaN(t)) return { pdf: NaN, cdf: NaN };

    const logPdf =
      globalThis.VM.stats.logGamma((df + 1) / 2) -
      globalThis.VM.stats.logGamma(df / 2) -
      0.5 * Math.log(df * Math.PI) -
      ((df + 1) / 2) * Math.log(1 + (t * t) / df);
    const pdf = Math.exp(logPdf);

    const x = df / (df + t * t);
    const half = globalThis.VM.stats.regularizedBetaI(x, df / 2, 0.5) / 2;
    let cdf;
    if (t > 0) {
      cdf = 1 - half;
    } else {
      cdf = half;
    }

    return { pdf, cdf };
  };

  globalThis.VM = { ...globalThis.VM, stats: { ...globalThis.VM?.stats, studentTDist } };
})(window);
