import { after } from "@api/patcher";
import { constants } from "@metro/common";
import { findByProps } from "@metro/wrappers";
import { definePlugin } from "@plugins";
import { Contributors } from "@rain/Developers";

const channelNames = findByProps("computeChannelName");
const patches: (() => void)[] = [];

export default definePlugin({
    name: "Dashless",
    description: "Changes dashes in text channel names to spaces",
    author: [Contributors.Awesomegamergame],
    id: "dashless",
    version: "1.0.0",
    eagerStart() {
        patches.push(
            after("computeChannelName", channelNames, ([channel], name) => {
                const { GUILD_TEXT, GUILD_ANNOUNCEMENT } = constants.ChannelTypes;
                if ((channel?.type === GUILD_TEXT || channel?.type === GUILD_ANNOUNCEMENT) && typeof name === "string")
                    return name.replace(/-/g, " ");
            })
        );
    },
    stop() {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },
});
