/**
 * Copyright (c) 2026 Dhruv Azad. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Dhruv Azad
 */

(function attachVM(globalThis) {
  // The F distribution with (df1, df2) degrees of freedom, evaluated at `x`.
  // Returns { pdf, cdf } -- the density for drawing the curve, and the
  // left-tail probability P(F <= x).
  //
  // The CDF is the regularized incomplete beta I_y(df1/2, df2/2) with
  // y = df1 * x / (df1 * x + df2); the density is written in log space so
  // its Beta(df1/2, df2/2) normalizer stays finite for large df.
  const fDist = (x, df1, df2) => {
    if (!(df1 > 0) || !(df2 > 0) || Number.isNaN(x)) return { pdf: NaN, cdf: NaN };
    if (x <= 0) return { pdf: 0, cdf: 0 };

    const logBeta =
      globalThis.VM.stats.logGamma(df1 / 2) +
      globalThis.VM.stats.logGamma(df2 / 2) -
      globalThis.VM.stats.logGamma((df1 + df2) / 2);
    const logPdf =
      (df1 / 2) * Math.log(df1) +
      (df2 / 2) * Math.log(df2) +
      (df1 / 2 - 1) * Math.log(x) -
      ((df1 + df2) / 2) * Math.log(df1 * x + df2) -
      logBeta;
    const pdf = Math.exp(logPdf);

    const y = (df1 * x) / (df1 * x + df2);
    const cdf = globalThis.VM.stats.regularizedBetaI(y, df1 / 2, df2 / 2);

    return { pdf, cdf };
  };

  globalThis.VM = { ...globalThis.VM, stats: { ...globalThis.VM?.stats, fDist } };
})(window);
