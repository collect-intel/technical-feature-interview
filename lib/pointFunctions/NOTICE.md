# Third-party notice

The point functions in this folder (and their tests in `__tests__/`) are ported
from [weval-org/app](https://github.com/weval-org/app), `src/point-functions/`,
at commit `e34db8b`. `js.ts` keeps weval's semantics but replaces its `node:vm`
evaluation with a QuickJS interpreter.

```
MIT License

Copyright (c) 2025 James Padolsey

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Interview-repo changes

Lifted from Weval Studio (`collect-intel/product-platform`,
`packages/shared/src/features/cip-blueprints/pointFunctions/`). Changes:
relative imports carry `.ts` extensions and type-only imports use
`import type`, so Node runs the files without a build step; `js.ts` keeps only
`regexMatch`, on the native RegExp engine instead of the QuickJS sandbox; the
`$js` / `expr` point function is removed.
