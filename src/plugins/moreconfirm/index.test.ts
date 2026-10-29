import { createRequire } from "node:module";

import { expect, mock, test } from "bun:test";

mock.module("sublimation", () => createRequire(import.meta.url)("sublimation/dist/index.js"));

test("Discord 351 channel calls wait for confirmation without rawRecipients", async () => {
    const original = mock();
    const calls = { handleStartCall: original };
    let confirmation: any;
    const dialog = { show: (options: any) => { confirmation = options; }, confirm() {}, close() {} };
    mock.module("@api", () => ({ patcher: createRequire(import.meta.url)("sublimation/dist/index.js") }));
    mock.module("@lib/utils/logger", () => ({ logger: { error: mock() } }));
    mock.module("@metro/common/stores", () => ({ UserStore: { getUser: () => ({ username: "user" }) } }));
    mock.module("@metro/wrappers", () => ({ findByProps: (key: string) => ({ show: dialog, handleStartCall: calls, addRelationship: { addRelationship: mock() }, hideActionSheet: { hideActionSheet: mock() } })[key] }));
    mock.module("@plugins", () => ({ definePlugin: (plugin: any) => plugin }));
    mock.module("@rain/Developers", () => ({ Contributors: {}, Developers: {} }));
    const { default: plugin } = await import("./index");
    plugin.start!();
    const channel = { getRecipientId: () => "user-id", recipients: ["user-id"] };
    calls.handleStartCall(channel, false);
    expect(original).not.toHaveBeenCalled();
    expect(confirmation.title).toContain("user");
    confirmation.onConfirm();
    expect(original).toHaveBeenCalledWith(channel, false);
    plugin.stop!();
});
