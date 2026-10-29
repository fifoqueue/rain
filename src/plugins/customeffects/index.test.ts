import { expect, mock, test } from "bun:test";

test("CustomEffects loads and removes all installed profile patches on stop", async () => {
    mock.module("@plugins", () => ({ definePlugin: (plugin: any) => plugin }));
    mock.module("@rain/Developers", () => ({ Developers: {} }));
    mock.module("./settings", () => ({ default: () => null }));
    mock.module("./patches/effects", () => ({ loadAllEffectData: async () => {} }));
    const undo = [mock(), mock(), mock()];
    mock.module("./patches/profile", () => ({ patchGetUserProfile: () => undo[0], patchGetAllProfileEffects: () => undo[1], patchGetProfileEffect: () => undo[2] }));
    const { default: plugin } = await import("./index");
    await plugin.start!();
    plugin.stop!();
    plugin.stop!();
    for (const unpatch of undo) expect(unpatch).toHaveBeenCalledTimes(1);
});
