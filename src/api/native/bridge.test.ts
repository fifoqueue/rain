import { afterEach, expect, test } from "bun:test";

const fallbackCalls: object[] = [];

Object.assign(globalThis, {
    window: {
        nativeModuleProxy: {
            FileReaderModule: {
                readAsDataURL: async (payload: object) => {
                    fallbackCalls.push(payload);
                    return { result: "fallback" };
                },
            },
        },
    },
});

const { callBridgeMethod } = await import("./bridge");

afterEach(() => {
    delete (globalThis as any).__RAIN_BRIDGE_CALL_ASYNC__;
    fallbackCalls.length = 0;
});

test("prefers the RainTweak JSI bridge", async () => {
    let received: object | undefined;
    (globalThis as any).__RAIN_BRIDGE_CALL_ASYNC__ = async (payload: object) => {
        received = payload;
        return { result: "native" };
    };

    expect(await callBridgeMethod("updater.clear", 1)).toBe("native");
    expect(received).toEqual({ rain: { method: "updater.clear", args: [1] } });
    expect(fallbackCalls).toHaveLength(0);
});

test("keeps the legacy native-module fallback", async () => {
    expect(await callBridgeMethod("updater.clear")).toBe("fallback");
    expect(fallbackCalls).toEqual([{ rain: { method: "updater.clear", args: [] } }]);
});
