import { expect, mock, test } from "bun:test";
import React from "react";

test("opens a Discord 351 toast with a separate key and renderable payload", async () => {
    let displayed: any;
    const open = mock((key: string, toast: any) => {
        const entry = { toast };
        displayed = { key, position: entry.toast.position ?? "top", ...entry.toast };
    });

    Object.assign(globalThis, { __DEV__: false });
    mock.module("@api/assets", () => ({ findAssetId: () => 42 }));
    mock.module("@metro/common", () => ({ React, ReactNative: { Image: "Image" }, toasts: { open } }));
    mock.module("@metro/wrappers", () => ({ findByProps: () => ({ uuid4: () => "test-id" }) }));
    mock.module("@rain/i18n", () => ({ Strings: { COPIED_TO_CLIPBOARD: "Copied" } }));

    const { showToast } = await import("./toasts");
    showToast.showCopyToClipboard();

    expect(open).toHaveBeenCalledTimes(1);
    expect(displayed).toMatchObject({ key: "rain-toast-test-id", text: "Copied", position: "top" });
    const icon = displayed.icon({ style: { marginRight: 8 } });
    expect(React.isValidElement(icon)).toBe(true);
    expect(icon.props.source).toBe(42);
    expect(icon.props.style).toContainEqual({ marginRight: 8 });
});
