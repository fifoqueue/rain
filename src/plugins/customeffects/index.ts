import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

import { loadAllEffectData } from "./patches/effects";
import { patchGetAllProfileEffects, patchGetProfileEffect, patchGetUserProfile } from "./patches/profile";
import Settings from "./settings";

const patches: (() => void)[] = [];
export default definePlugin({
    name: "CustomEffects",
    description: "Custom profile effects",
    author: [Developers.SerStars],
    id: "customeffects",
    version: "2.1.0",

    async start() {
        await loadAllEffectData();

        patches.push(patchGetUserProfile());
        patches.push(patchGetAllProfileEffects());
        patches.push(patchGetProfileEffect());
    },

    stop() {
        for (const unpatch of patches.splice(0).reverse()) unpatch();
    },
    settings: Settings
});
