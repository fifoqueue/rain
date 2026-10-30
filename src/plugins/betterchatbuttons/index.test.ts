import { createRequire } from "node:module";

import { expect, mock, test } from "bun:test";
import React from "react";

mock.module("sublimation", () => createRequire(import.meta.url)("sublimation/dist/index.js"));

test("patches memo chat buttons before mount and subscribes to live settings", async () => {
    const components = Object.fromEntries(["ChatInputActions", "ChatInputSendButton", "ChatInputRightActions"]
        .map(name => [name, React.memo((props: any) => props)]));
    let state = { hide: { voice: true, gift: true, app: true, thread: true }, show: { thread: false }, dismiss: { send: true, actions: true } };
    const useSettings = Object.assign(mock(() => state), { getState: () => state });
    mock.module("@metro", () => ({ findByTypeDisplayName: (name: string) => components[name] }));
    mock.module("@plugins", () => ({ definePlugin: (plugin: any) => plugin }));
    mock.module("@rain/Developers", () => ({ Contributors: { palmdevs: {} } }));
    mock.module("@lib/utils/logger", () => ({ logger: { log: mock() } }));
    mock.module("./settings", () => ({ default: () => null }));
    mock.module("./storage", () => ({ useBetterChatButtonsSettings: useSettings }));

    const { default: plugin } = await import("./index");
    await plugin.eagerStart!();
    // React retains the inner function on the fiber when a simple memo mounts.
    const send = components.ChatInputSendButton.type;
    const right = components.ChatInputRightActions.type;
    const actions = components.ChatInputActions.type;
    const props = Object.freeze({ canSendVoiceMessage: true, shouldShowGiftButton: true, isAppLauncherEnabled: true, canStartThreads: true });
    expect(send(props)).toMatchObject({ canSendVoiceMessage: false, requireTextContent: true });
    expect(right(props).shouldShowGiftButton).toBe(false);
    expect(actions(props)).toMatchObject({ isAppLauncherEnabled: false, canStartThreads: false });
    expect(useSettings).toHaveBeenCalledTimes(3);

    state = { hide: { voice: false, gift: false, app: false, thread: false }, show: { thread: false }, dismiss: { send: false, actions: true } };
    expect(send(props)).toMatchObject({ canSendVoiceMessage: true, requireTextContent: false });
    expect(right(props).shouldShowGiftButton).toBe(true);
    expect(actions(props)).toMatchObject({ isAppLauncherEnabled: true, canStartThreads: true });
    expect(useSettings).toHaveBeenCalledTimes(6);

    plugin.stop!();
    expect(components.ChatInputActions.type(props)).toBe(props);
});
