import { createRequire } from "node:module";

import { expect, mock, test } from "bun:test";
import React from "react";

mock.module("sublimation", () => createRequire(import.meta.url)("sublimation/dist/index.js"));

test("changes Discord 351 chat input props without requiring forwardRef.render", async () => {
    const components = Object.fromEntries(["ChatInputActions", "ChatInputSendButton", "ChatInputRightActions"]
        .map(name => [name, React.memo((props: any) => props)]));
    const state = { hide: { voice: true, gift: true, app: true, thread: false }, show: { thread: false }, dismiss: { send: true, actions: true } };
    mock.module("@metro", () => ({ findByTypeDisplayName: (name: string) => components[name] }));
    mock.module("@plugins", () => ({ definePlugin: (plugin: any) => plugin }));
    mock.module("@rain/Developers", () => ({ Contributors: { palmdevs: {} } }));
    mock.module("@lib/utils/logger", () => ({ logger: { log: mock() } }));
    mock.module("./settings", () => ({ default: () => null }));
    mock.module("./storage", () => ({ useBetterChatButtonsSettings: { getState: () => state } }));

    const { default: plugin } = await import("./index");
    await plugin.start!();
    const props = Object.freeze({ canSendVoiceMessage: true, shouldShowGiftButton: true, isAppLauncherEnabled: true, canStartThreads: false });
    expect(components.ChatInputSendButton.type(props)).toMatchObject({ canSendVoiceMessage: false, requireTextContent: true });
    expect(components.ChatInputRightActions.type(props).shouldShowGiftButton).toBe(false);
    expect(components.ChatInputActions.type(props)).toMatchObject({ isAppLauncherEnabled: false, canStartThreads: false });
    plugin.stop!();
    expect(components.ChatInputActions.type(props)).toBe(props);
});
