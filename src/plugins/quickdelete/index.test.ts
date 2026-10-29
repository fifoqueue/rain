import { createRequire } from "node:module";

import { expect, mock, test } from "bun:test";

mock.module("sublimation", () => createRequire(import.meta.url)("sublimation/dist/index.js"));

test("message text cannot turn an unrelated confirmation into an automatic deletion", async () => {
    const show = mock();
    const popup = { show, openLazy() {} };
    mock.module("@metro", () => ({ findByProps: (key: string) => key === "intl" ? {} : popup }));
    mock.module("@plugins", () => ({ definePlugin: (plugin: any) => plugin }));
    mock.module("@rain/Developers", () => ({ Contributors: {}, Developers: {} }));
    mock.module("./Settings", () => ({ default: () => null }));
    mock.module("./storage", () => ({ quickDeleteSettings: { autoConfirmMessage: true, autoConfirmEmbed: true } }));
    const { default: plugin } = await import("./index");
    plugin.start!();
    const onConfirm = mock();
    popup.show({ title: "Delete Channel", children: { props: { message: { content: "Delete Message" } } }, onConfirm });
    expect(onConfirm).not.toHaveBeenCalled();
    expect(show).toHaveBeenCalledTimes(1);
    plugin.stop!();
});
