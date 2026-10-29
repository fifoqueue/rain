import { expect, mock, test } from "bun:test";

test("enabling an eager plugin runs both stages once and allows restart after stop", async () => {
    mock.module("@api/settings", () => ({ useSettings: { getState: () => ({ safeMode: false }) } }));
    mock.module("@api/storage", () => ({
        createFileStorage: () => ({ getItem: async () => null, setItem: async () => {}, removeItem: async () => {} }),
        waitForHydration: async () => {},
    }));
    mock.module("@api/ui/toasts", () => ({ showToast: mock() }));
    mock.module("@lib/utils/logger", () => ({ logger: { log: mock(), error: mock() } }));
    mock.module("react-native", () => ({ Platform: { OS: "ios" } }));

    const { pluginInstances, startEagerPlugin, startPlugin, stopPlugin } = await import("./index");
    const eagerStart = mock();
    const start = mock();
    const stop = mock();
    pluginInstances.set("test-plugin", { id: "test-plugin", name: "Test", description: "", version: "1", author: [], eagerStart, start, stop });

    await startEagerPlugin("test-plugin");
    await Promise.all([startPlugin("test-plugin"), startPlugin("test-plugin")]);
    expect(eagerStart).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledTimes(1);
    await stopPlugin("test-plugin");
    await startPlugin("test-plugin");
    expect(eagerStart).toHaveBeenCalledTimes(2);
    expect(start).toHaveBeenCalledTimes(2);
    expect(stop).toHaveBeenCalledTimes(1);
    await stopPlugin("test-plugin");
    pluginInstances.delete("test-plugin");
});
