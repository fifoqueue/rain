import { getNativeModule } from "./modules";

const BridgePromise = getNativeModule<{
    readAsDataURL(map: object): Promise<any>
        }>("FileReaderModule")!;

function makePayload(name: string, args: any[]): object {
    return {
        rain: {
            method: name,
            args: args,
        },
    };
}

export async function callBridgeMethod(method: string, ...args: any[]): Promise<any> {
    try {
        const payload = makePayload(method, args);
        const result = await (
            (globalThis as any).__RAIN_BRIDGE_CALL_ASYNC__?.(payload)
            ?? BridgePromise.readAsDataURL(payload)
        );

        if ("error" in result) throw result.error;
        if ("result" in result) return result.result;

        throw "The module did not return a valid result. The native hook must have failed.";
    } catch (error) {
        throw new Error(`Call failed: ${error}`);
    }
}
