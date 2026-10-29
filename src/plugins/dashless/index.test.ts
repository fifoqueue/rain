import { createRequire } from "node:module";

import { expect, mock, test } from "bun:test";

mock.module("sublimation", () => createRequire(import.meta.url)("sublimation/dist/index.js"));

test("Dashless changes channel display names without modifying the channel record", async () => {
    const names = { computeChannelName: (channel: any) => channel.name };
    mock.module("@metro/wrappers", () => ({ findByProps: () => names }));
    mock.module("@metro/common", () => ({ constants: { ChannelTypes: { GUILD_TEXT: 0, GUILD_ANNOUNCEMENT: 5 } } }));
    mock.module("@plugins", () => ({ definePlugin: (plugin: any) => plugin }));
    mock.module("@rain/Developers", () => ({ Contributors: {} }));
    const { default: plugin } = await import("./index");
    const channel = Object.freeze({ type: 0, name: "general-chat" });
    plugin.eagerStart!();
    expect(names.computeChannelName(channel)).toBe("general chat");
    expect(channel.name).toBe("general-chat");
    plugin.stop!();
    expect(names.computeChannelName(channel)).toBe("general-chat");
});
