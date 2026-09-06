/**
 * Copyright (c) 2026 Dhruv Azad. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Dhruv Azad
 */

(function attachVM(globalThis) {
  // The chi-square distribution with `df` degrees of freedom, evaluated at
  // `x`. Returns { pdf, cdf } -- the density for drawing the curve, and the
  // left-tail probability P(X <= x) so the right tail 1 - cdf is the
  // goodness-of-fit p-value.
  //
  // The CDF is the regularized lower incomplete gamma P(df/2, x/2); the
  // density is written in log space so its 2^(df/2) * Gamma(df/2) normalizer
  // stays finite for the large df a many-category or large-sample test hits.
  const chiSquareDist = (x, df) => {
    if (!(df > 0) || Number.isNaN(x)) return { pdf: NaN, cdf: NaN };
    if (x < 0) return { pdf: 0, cdf: 0 };

    const half = df / 2;
    let pdf;
    if (x === 0) {
      // Left endpoint: 0 for df > 2, the finite value 0.5 at df = 2, and a
      // pole for df < 2. Callers sample the curve from a small positive x,
      // so this branch is only hit by a direct pdf(0) query.
      if (df > 2) pdf = 0;
      else if (df === 2) pdf = 0.5;
      else pdf = Infinity;
    } else {
      const logPdf =
        (half - 1) * Math.log(x) - x / 2 - half * Math.LN2 - globalThis.VM.stats.logGamma(half);
      pdf = Math.exp(logPdf);
    }

    const cdf = globalThis.VM.stats.regularizedGammaP(half, x / 2);
    return { pdf, cdf };
  };

  globalThis.VM = { ...globalThis.VM, stats: { ...globalThis.VM?.stats, chiSquareDist } };
})(window);
