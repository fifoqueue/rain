import { after,before } from "@api/patcher";
import { getComponentPatchTarget } from "@api/react/patchTarget";
import findInReactTree from "@lib/utils/findInReactTree";
import { findByProps } from "@metro";
import { React } from "@metro/common";

import StealButtons from "./ui/components/StealButtons";

function patchSheet(funcName: string, sheetModule: any, once: boolean) {
    const innerPatches: (() => void)[] = [];
    const unpatch = after(...getComponentPatchTarget(sheetModule, funcName), (args: any[], res: any) => {
        const emojiNode = args[0]?.emojiNode;
        if (!emojiNode?.src) return;
        // Try to extract id, name, animated from emojiNode or args[0].emoji
        const emoji: { src: string; id?: string; name?: string; animated?: boolean } = {
            src: emojiNode.src,
        };
        if (args[0]?.emoji) {
            emoji.id = args[0].emoji.id;
            emoji.name = args[0].emoji.name;
            emoji.animated = args[0].emoji.animated;
        } else {
            // fallback: try to parse from src
            const match = /\/emojis\/(\d+)\.(gif|png)/.exec(emojiNode.src);
            if (match) {
                emoji.id = match[1];
                emoji.animated = match[2] === "gif";
            }
        }
        // fallback: try to get name from alt or parent props
        if (!emoji.name && emojiNode.alt) {
            emoji.name = emojiNode.alt.replace(/:/g, "");
        }
        const view = res?.props?.children?.props?.children;
        if (!view) return;
        innerPatches.push(after(...getComponentPatchTarget(view, "type"), (_: any, component: any) => {
            const isButton = (c: any) => c?.type?.name === "Button";
            const buttonsContainer = findInReactTree(component, (c: any) => Array.isArray(c) && c.some(isButton));
            if (buttonsContainer) {
                const buttonIndex = buttonsContainer.findLastIndex(isButton);
                if (buttonIndex >= 0) {
                    buttonsContainer.splice(buttonIndex + 1, 0, React.createElement(StealButtons, { emoji }));
                } else {
                    buttonsContainer.push(React.createElement(StealButtons, { emoji }));
                }
            } else if (component?.props?.children?.push) {
                component.props.children.push(React.createElement(StealButtons, { emoji }));
            }
        }));
        if (once) {
            unpatch();
        }
    });
    return () => { unpatch(); for (const undo of innerPatches.splice(0)) undo(); };
}

export default function patchMessageEmojiActionSheet() {
    const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
    if (!LazyActionSheet) return () => {};
    const patches: Array<() => void> = [];
    const unpatchLazy = before("openLazy", LazyActionSheet, ([lazySheet, name]) => {
        if (!["MessageEmojiActionSheet", "MessageCustomEmojiActionSheet"].includes(name)) return;
        unpatchLazy();
        lazySheet.then((module: any) => {
            patches.push(after(...getComponentPatchTarget(module, "default"), (_: any, res: any) => {
                if (res?.type) patches.push(patchSheet("type", res, true));
            }));
        });
    });
    return () => {
        unpatchLazy();
        patches.forEach((p: () => void) => p?.());
    };
}
