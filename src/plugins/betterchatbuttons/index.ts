import { after, before, instead } from "@api/patcher";
import { getComponentPatchTarget } from "@api/react/patchTarget";
import { findByTypeDisplayName } from "@metro";
import { definePlugin } from "@plugins";
import { Contributors } from "@rain/Developers";

import BetterChatButtonsSettings from "./settings";
import { useBetterChatButtonsSettings } from "./storage";

const ChatInputActions = findByTypeDisplayName("ChatInputActions");
const ChatInputSendButton = findByTypeDisplayName("ChatInputSendButton");
const ChatInputRightActions = findByTypeDisplayName("ChatInputRightActions");
const unpatches: (() => void)[] = [];
const patchedHandles = new WeakSet<object>();
let active = false;

export default definePlugin({
    name: "BetterChatButtons",
    description: "Customize all the annoying chat buttons",
    author: [Contributors.palmdevs],
    id: "betterchatbuttons",
    version: "1.1.0",
    start() {
        if (active) return;
        const sendTarget = getComponentPatchTarget({ component: ChatInputSendButton }, "component");
        const rightTarget = getComponentPatchTarget({ component: ChatInputRightActions }, "component");
        const actionsTarget = getComponentPatchTarget({ component: ChatInputActions }, "component");
        active = true;

        unpatches.push(before(...sendTarget, ([props, ...rest]) => {
            const state = useBetterChatButtonsSettings.getState();
            return [{ ...props,
                canSendVoiceMessage: props.canSendVoiceMessage && !state.hide.voice,
                requireTextContent: state.dismiss.send,
            }, ...rest];
        }));
        unpatches.push(before(...rightTarget, ([props, ...rest]) => [{
            ...props,
            shouldShowGiftButton: props.shouldShowGiftButton && !useBetterChatButtonsSettings.getState().hide.gift,
        }, ...rest]));
        unpatches.push(before(...actionsTarget, ([props, ...rest]) => {
            const state = useBetterChatButtonsSettings.getState();
            return [{ ...props,
                isAppLauncherEnabled: props.isAppLauncherEnabled && !state.hide.app,
                canStartThreads: state.show.thread || (props.canStartThreads && !state.hide.thread),
                shouldShowGiftButton: props.shouldShowGiftButton && !state.hide.gift,
            }, ...rest];
        }));
        unpatches.push(after(...actionsTarget, ([props, legacyRef]) => {
            const ref = props.ref ?? legacyRef;
            setImmediate(() => {
                const handle = ref?.current;
                if (!active || !handle || patchedHandles.has(handle) || typeof handle.onDismissActions !== "function") return;
                patchedHandles.add(handle);
                unpatches.push(() => patchedHandles.delete(handle));
                unpatches.push(instead("onDismissActions", handle, (args, original) => {
                    if (useBetterChatButtonsSettings.getState().dismiss.actions) return original(...args);
                }));
            });
        }));
    },
    stop() {
        active = false;
        for (const unpatch of unpatches.splice(0).reverse()) unpatch();
    },
    settings: BetterChatButtonsSettings,
});
