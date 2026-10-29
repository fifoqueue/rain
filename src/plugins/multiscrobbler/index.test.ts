import { expect, mock, test } from "bun:test";

test("MultiScrobbler lets its manager stop timers before marking the plugin stopped", async () => {
    const pluginState = { pluginStopped: false };
    const stop = mock(() => {
        expect(pluginState.pluginStopped).toBe(false);
        pluginState.pluginStopped = true;
    });
    mock.module("@api/storage", () => ({ waitForHydration: async () => {} }));
    mock.module("@lib/utils/logger", () => ({ logger: { log: mock(), error: mock(), verbose: mock() } }));
    mock.module("@metro/common", () => ({ FluxDispatcher: { subscribe: mock(), unsubscribe: mock() } }));
    mock.module("@metro/common/stores", () => ({ UserStore: {} }));
    mock.module("@plugins", () => ({ definePlugin: (plugin: any) => plugin }));
    mock.module("@rain/Developers", () => ({ Developers: {} }));
    mock.module("./manager", () => ({ initialize: mock(), stop }));
    mock.module("./services/ServiceFactory", () => ({ serviceFactory: {} }));
    mock.module("./storage", () => ({ currentSettings: {}, pluginState, useMultiScrobblerSettings: {} }));
    mock.module("./ui/pages/Settings", () => ({ default: () => null }));
    const { default: plugin } = await import("./index");
    plugin.stop!();
    expect(stop).toHaveBeenCalledTimes(1);
    expect(pluginState.pluginStopped).toBe(true);
});
