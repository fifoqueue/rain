import { createRequire } from "node:module";

import { expect, mock, test } from "bun:test";

mock.module("sublimation", () => createRequire(import.meta.url)("sublimation/dist/index.js"));

test("unregistering the same JSX callback twice does not remove another plugin's callback", async () => {
    const runtime = { jsx: (type: any, props: any) => ({ type, props }), jsxs: (type: any, props: any) => ({ type, props }) };
    mock.module("@metro", () => ({ findByPropsLazy: () => runtime }));
    const { onJsxCreate, patchJsx } = await import("./jsx");
    const restore = patchJsx();
    const first = mock();
    const second = mock();
    const removeFirst = onJsxCreate("Badge", first);
    const removeSecond = onJsxCreate("Badge", second);
    removeFirst();
    removeFirst();
    runtime.jsx(function Badge() {}, {});
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    removeSecond();
    restore();
});
