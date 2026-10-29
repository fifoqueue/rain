import { createRequire } from "node:module";

import { expect, mock, test } from "bun:test";

const patcher = createRequire(import.meta.url)("sublimation/dist/index.js");
mock.module("sublimation", () => patcher);

test("files within Discord's real limit stay on Discord and preserve other upload patches", async () => {
    class CloudUpload {
        preCompressionSize = 12 * 1024 * 1024;
        channelId = "channel";
        async reactNativeCompressAndExtractData() { return "native upload"; }
    }
    const limits = { maxFileSize: () => 50 * 1024 * 1024 };
    const messages = { sendMessage: mock() };
    const modules: Record<string, any> = { CloudUpload: { CloudUpload }, sendMessage: messages, maxFileSize: limits };
    const findByProps = (...keys: string[]) => {
        const module = modules[keys[0]];
        return keys.every(key => module?.[key]) ? module : undefined;
    };
    mock.module("@metro", () => ({ findByProps, findByPropsLazy: findByProps }));
    mock.module("@metro/wrappers", () => ({ findByProps }));
    mock.module("@metro/common", () => ({ clipboard: { setString: mock() } }));
    mock.module("@metro/common/stores", () => ({ ChannelStore: { getChannel: () => ({ guild_id: "guild" }) } }));
    mock.module("@api/assets", () => ({ findAssetId: mock() }));
    mock.module("@api/ui/toasts", () => ({ showToast: mock() }));
    mock.module("@lib/utils/logger", () => ({ logger: { error: mock(), info: mock() } }));
    mock.module("../storage", () => ({ uploaderSettings: { alwaysUpload: false, selectedHost: "catbox" } }));
    const externalUpload = mock();
    mock.module("../api/catbox", () => ({ uploadToCatbox: externalUpload }));
    mock.module("../api/litterbox", () => ({ uploadToLitterbox: externalUpload }));
    mock.module("../api/uguu", () => ({ uploadToUguu: externalUpload }));
    mock.module("../api/zipline", () => ({ uploadToZipline: externalUpload }));

    const otherPlugin = mock();
    const undoOtherPlugin = patcher.before("reactNativeCompressAndExtractData", CloudUpload.prototype, otherPlugin);
    const { default: install } = await import("./upload");
    const patches = install();
    expect(await new CloudUpload().reactNativeCompressAndExtractData()).toBe("native upload");
    expect(externalUpload).not.toHaveBeenCalled();
    patches.reverse().forEach(unpatch => unpatch());
    await new CloudUpload().reactNativeCompressAndExtractData();
    expect(otherPlugin).toHaveBeenCalledTimes(2);
    expect(limits.maxFileSize()).toBe(50 * 1024 * 1024);
    undoOtherPlugin();
});
