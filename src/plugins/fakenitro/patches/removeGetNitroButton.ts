import { after,before } from "@api/patcher";
import { getComponentPatchTarget } from "@api/react/patchTarget";
import findInReactTree from "@lib/utils/findInReactTree";
import { findByProps } from "@metro";

function patchSheet(funcName: string, sheetModule: any, once: boolean) {
    const innerPatches: (() => void)[] = [];
    const unpatch = after(...getComponentPatchTarget(sheetModule, funcName), (args: any[], res: any) => {
        const emojiNode = args[0]?.emojiNode;
        if (!emojiNode?.src) return;
        const view = res?.props?.children?.props?.children;
        if (!view) return;
        innerPatches.push(after(...getComponentPatchTarget(view, "type"), (_: any, component: any) => {
            const isButton = (c: any) => c?.type?.name === "Button";
            const isGetNitro = (c: any) =>
                (typeof c?.props?.text === "string" && c.props.text.toLowerCase().includes("nitro")) ||
                (typeof c?.props?.children === "string" && c.props.children.toLowerCase().includes("nitro"));
            const buttonsContainer = findInReactTree(component, (c: any) => Array.isArray(c) && c.some(isButton));
            if (buttonsContainer) {
                // Remove Get Nitro button(s)
                for (let i = buttonsContainer.length - 1; i >= 0; i--) {
                    if (isGetNitro(buttonsContainer[i])) {
                        buttonsContainer.splice(i, 1);
                    }
                }
            } else if (component?.props?.children?.push) {
                // Remove Get Nitro button if present in children
                if (Array.isArray(component.props.children)) {
                    for (let i = component.props.children.length - 1; i >= 0; i--) {
                        if (isGetNitro(component.props.children[i])) {
                            component.props.children.splice(i, 1);
                        }
                    }
                }
            }
        }));
        if (once) {
            unpatch();
        }
    });
    return () => { unpatch(); for (const undo of innerPatches.splice(0)) undo(); };
}

export default function getPatches() {
    return [
        (() => {
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
        })()
    ];
}
