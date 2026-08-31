import { instead } from "@api/patcher";
import { ReactNative as RN } from "@metro/common";
import { definePlugin } from "@plugins";
import { Contributors,Developers } from "@rain/Developers";

const patches: any[] = [];

export default definePlugin({
    name: "BluetoothAudioFix",
    description: "Prevents Discord from enabling handsfree mode while in a call",
    author: [
        Contributors.Narwhal,
        Contributors.redstonekasi,
        Developers.reyyan1
    ],
    id: "bluetoothaudiofix",
    version: "1.0.0",
    platforms: ["android"],
    start() {
        const onUnload = RN.TurboModuleRegistry.get("NativeAudioManagerModule") === null ? RN.TurboModuleRegistry.get("RTNAudioManager") : RN.TurboModuleRegistry.get("NativeAudioManagerModule");
        patches.push(instead("setCommunicationModeOn", onUnload, () => {}));
    },
    stop() {
        for (const unpatch of patches) unpatch();
    },
});
