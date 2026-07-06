/**
 * Copyright (c) 2026 Apurva Nakade, Copilot. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: Apurva Nakade, Copilot
 */

/**
 * Assemble the fixed-point page API from its method-local parts.
 */
(function attachFixedPointApp(globalThis) {
  const methodAppUtils = globalThis.VisualMathMethodAppUtils
  const app = globalThis.VisualMathFixedPointAppParts

  globalThis.VisualMathFixedPointApp = methodAppUtils.createMethodApp({
    compute: app.compute,
    buildPlotModel: app.buildPlotModel,
    buildTraces: app.buildTraces,
    config: app.config
  })
})(window)
