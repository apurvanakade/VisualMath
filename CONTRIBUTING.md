Here is an updated `CONTRIBUTING.md` text that handles multiple file types.

Since different programming languages use different syntax for comments (e.g., `//` for JavaScript, `#` for Python, `<!-- -->` for HTML, and `/- -/` for Lean), I have broken down the template section so collaborators can copy the exact comment style they need for their specific file.

---

```markdown
# Contributing to VisualMath

Thank you for your interest in contributing to `VisualMath`! We welcome contributions from everyone, whether you are writing Lean proofs, developing interactive JavaScript visualizations, structuring HTML pages, or writing Python scripts.

## Licensing Policy

By contributing to this repository, you agree that your contributions will be licensed under the project's [Apache License 2.0](LICENSE). 

Because copyright in this project is distributed, you retain ownership of your code, but you grant the community a perpetual, royalty-free license to use, modify, and distribute it under the Apache 2.0 terms.

---

## File Header Templates

To maintain consistency and ensure everyone receives proper academic and legal credit, **every new code file added to this repository must include a copyright header at the very top.** 

Please copy, paste, and update the template matching your file's language:

### 1. Lean Files (`.lean`)
```lean
/-
Copyright (c) 2026 [Your Name]. All rights reserved.
Released under Apache 2.0 license as described in the file LICENSE.
Authors: [Your Name]
-/

```

### 2. JavaScript / TypeScript / CSS Files (`.js`, `.ts`, `.css`)

```javascript
/**
 * Copyright (c) 2026 [Your Name]. All rights reserved.
 * Released under Apache 2.0 license as described in the file LICENSE.
 * Authors: [Your Name]
 */

```

### 3. Python / R / Configuration Files (`.py`, `.R`, `.yml`)

```python
# Copyright (c) 2026 [Your Name]. All rights reserved.
# Released under Apache 2.0 license as described in the file LICENSE.
# Authors: [Your Name]

```

### 4. HTML Files (`.html`)

```html
<!--
Copyright (c) 2026 [Your Name]. All rights reserved.
Released under Apache 2.0 license as described in the file LICENSE.
Authors: [Your Name]
-->

```

---

## Managing Headers on Existing Files

* **Minor edits:** If you are fixing a bug, adjusting layout spacing, or correcting a typo in an existing file, you do not need to alter the header.
* **Significant additions:** If you contribute a substantial new feature, theorem, script, or section to an existing file, please add your name to the `Authors` line of that file:
```text
Authors: Apurva Nakade, [Your Name]

```



```

```
