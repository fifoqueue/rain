import { createRequire } from "node:module";

import { expect, mock, test } from "bun:test";

mock.module("sublimation", () => createRequire(import.meta.url)("sublimation/dist/index.js"));

test("reopening a lazy sheet installs one hook and disabling removes it", async () => {
    const sheets = { openLazy: mock(), hideActionSheet: mock() };
    mock.module("@metro/wrappers", () => ({ findByPropsLazy: () => sheets }));
    mock.module("@lib/utils/logger", () => ({ logger: { error: mock() } }));
    const { afterLazySheet } = await import("./sheets");
    const render = (props: any) => props.message;
    const module = { default: render };
    const callback = mock((_args: unknown[], tree: string) => tree.toUpperCase());
    const unpatch = afterLazySheet("MessageLongPressActionSheet", callback);
    sheets.openLazy(Promise.resolve(module), "MessageLongPressActionSheet");
    sheets.openLazy(Promise.resolve(module), "MessageLongPressActionSheet");
    await Promise.resolve();

    expect(module.default({ message: "current message" })).toBe("CURRENT MESSAGE");
    expect(callback).toHaveBeenCalledTimes(1);
    unpatch();
    expect(module.default).toBe(render);
});
