import { createRequire } from "node:module";

import { expect, mock, test } from "bun:test";

const require = createRequire(import.meta.url);
mock.module("sublimation", () => require("sublimation/dist/index.js"));

test("patches lazily loaded function Messages without accessing render", async () => {
    let loadModule: () => void = () => {};
    const tree = { props: { children: "messages" } };
    const original = () => tree;
    const module = { default: original };
    const getExports = (callback: (exports: any) => void) => {
        loadModule = () => callback(module);
        return () => { loadModule = () => {}; };
    };
    const delay = Symbol.for("rain.api.patcher.delay");

    mock.module("@metro", () => ({
        findByFilePathLazy: (_path: string, exportDefault: boolean) => ({
            [delay]: (callback: (exports: any) => void) => getExports(exports => callback(exportDefault ? exports.default : exports)),
        }),
    }));
    mock.module("@metro/lazy", () => ({ getLazyContext: () => ({ getExports }) }));
    mock.module("@lib/utils", () => ({ findInReactTree: () => undefined }));
    mock.module("@lib/utils/logger", () => ({ logger: { error: mock() } }));
    mock.module("../preferences", () => ({ useColorsPref: () => "visible" }));
    mock.module("../updater", () => ({ _colorRef: { current: { background: { url: "https://example.com/background.png" } } } }));
    mock.module("chroma-js", () => ({ default: {} }));
    mock.module("react-native", () => ({ ImageBackground: "ImageBackground", StyleSheet: {} }));

    const { default: patchChatBackground } = await import("./background");
    const unpatch = patchChatBackground();

    expect(() => loadModule()).not.toThrow();
    expect(module.default()).toMatchObject({ props: { children: tree } });
    unpatch();
    expect(module.default).toBe(original);
});
