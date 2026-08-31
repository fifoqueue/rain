import { findByProps, findByStoreName, findByTypeName } from "@metro";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

import { patchFuture } from "./patches/future";
import Settings from "./Settings";

let patches: (() => void)[] = [];

export default definePlugin({
    name: "BetterYouBar",
    description: "Customize your YouBar to make it cooler: extra buttons and custom background",
    id: "betteryoubar",
    requiresRestart: true,
    version: "1.0.0",
    author: [Developers.j],
    settings: Settings,
    start() {
        const UserStore = findByStoreName("UserStore");
        const { transitionToGuild } = findByProps("transitionToGuild") || {};
        const { openUserSettings } = findByProps("openUserSettings") || {};
        const { IconButton } = findByProps("IconButton") || {};

        const options = {
            UserStore,
            transitionToGuild,
            openUserSettings,
            IconButton
        };

        const YouBarBackground = findByTypeName("YouBarBackground");
        const YouBarNameplate = findByTypeName("YouBarNameplate");
        const YouBarNotificationsButton = findByTypeName("YouBarNotificationsButton");

        patches.push(...patchFuture(YouBarBackground, YouBarNameplate, YouBarNotificationsButton, options));

        UserStore?.emitChange?.();
    },
    stop() {
        for (const unpatch of patches) {
            unpatch();
        }
        patches = [];
    }
});
