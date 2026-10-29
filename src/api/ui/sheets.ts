import { after, before } from "@api/patcher";
import { getComponentPatchTarget } from "@api/react/patchTarget";
import { logger } from "@lib/utils/logger";
import { findByPropsLazy } from "@metro/wrappers";

const actionSheet = findByPropsLazy("openLazy", "hideActionSheet");

export function afterLazySheet(key: string, callback: (args: any[], tree: any) => unknown): () => void {
    const installed = new WeakSet<object>();
    const patches: (() => void)[] = [];
    let active = true;

    patches.push(before("openLazy", actionSheet, ([sheet, sheetKey]) => {
        if (sheetKey !== key) return;
        Promise.resolve(sheet).then(module => {
            if (!active || installed.has(module)) return;
            patches.push(after(...getComponentPatchTarget(module, "default"), callback));
            installed.add(module);
        }).catch(error => logger.error(`Failed to patch ${key}`, error));
    }));

    return () => {
        active = false;
        for (const unpatch of patches.splice(0).reverse()) unpatch();
    };
}

export function showSheet<T extends React.ComponentType<any>>(
    key: string,
    lazyImport: Promise<{ default: T; }> | T,
    props?: React.ComponentProps<T>
) {
    if (!("then" in lazyImport)) lazyImport = Promise.resolve({ default: lazyImport });
    actionSheet.openLazy(lazyImport, key, props ?? {});
}

export function hideSheet(key: string) {
    actionSheet.hideActionSheet(key);
}
