import { instead } from "@api/patcher";
import { findByProps } from "@metro";
import { definePlugin } from "@plugins";
import { Contributors,Developers } from "@rain/Developers";

import Settings from "./Settings";
import { quickDeleteSettings } from "./storage";

const { intl, t: intlMap } = findByProps("intl");

const KEYS = {
    message: {
        hash: "xwMqD7",
        storage: "autoConfirmMessage",
        default: true,
    },
    embed: {
        hash: "GT3fNz",
        storage: "autoConfirmEmbed",
        default: true,
    },
} as const;

let autoConfirmMessages: { embed: string; message: string };

let unpatch: () => void;

export default definePlugin({
    name: "QuickDelete",
    description: "Automatically confirm delete popups for messages and embeds",
    author: [
        Contributors.TheSun,
        Contributors.PurpleEye,
        Developers.kmmiio99o,
        Developers.SerStars
    ],
    id: "quickdelete",
    version: "1.0.1",
    settings: Settings,
    start() {
        if (intl && intlMap) {
            autoConfirmMessages = {
                embed: intl.string(intlMap[KEYS.embed.hash]) || "Remove All Embeds",
                message: intl.string(intlMap[KEYS.message.hash]) || "Delete Message",
            };
        } else {
            autoConfirmMessages = {
                embed: "Remove All Embeds",
                message: "Delete Message",
            };
        }

        const Popup = findByProps("show", "openLazy");
        if (!Popup) return;

        unpatch = instead("show", Popup, (args, fn) => {
            const popup = args?.[0];
            const title = popup?.title;

            if (
                !popup?.onConfirm ||
                typeof popup.onConfirm !== "function" ||
                typeof title !== "string"
            ) {
                return fn(...args);
            }

            const shouldConfirm = (type: "message" | "embed") => {
                const matcher = autoConfirmMessages[type];
                if (!matcher) return false;

                const match = title.trim().toLowerCase() === matcher.trim().toLowerCase();
                return quickDeleteSettings[KEYS[type].storage] && match;
            };

            const result = shouldConfirm("message") || shouldConfirm("embed");
            return result ? popup.onConfirm() : fn(...args);
        });
    },
    stop() {
        unpatch?.();
    },
});
