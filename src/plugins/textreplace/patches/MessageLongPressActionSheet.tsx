import { findAssetId } from "@api/assets";
import { afterLazySheet } from "@api/ui/sheets";
import { showToast } from "@api/ui/toasts";
import { findInReactTree } from "@lib/utils";
import { findByProps } from "@metro";
import { React } from "@metro/common";

import { useTextReplaceSettings } from "../storage";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const ActionSheetRow = findByProps("ActionSheetRow")?.ActionSheetRow;
const DownloadIcon = findAssetId("DownloadIcon");
const JSON_CODEBLOCK_PATTERN = /^```(?:json)\n([\s\S]*?)```$/gm;

export default function patchMessageLongPressActionSheet() {
    return afterLazySheet("MessageLongPressActionSheet", ([props], res) => {
        const content = props?.message?.content;
        if (!content) return;
        const rules = [...content.matchAll(JSON_CODEBLOCK_PATTERN)]
            .map(m => {
                try {
                    return JSON.parse(m[1]);
                } catch {
                    return null;
                }
            })
            .filter(
                r =>
                    r &&
                            typeof r.name === "string" &&
                            typeof r.match === "string" &&
                            typeof r.replace === "string",
            );

        if (!rules.length) return;

        const buttons = findInReactTree(
            res,
            x => Array.isArray(x) && x.some(c => c?.type?.name === "ActionSheetRow"),
        );
        if (!buttons) return;

        rules.forEach((rule: any) => {
            if (buttons.some((button: any) => button?.key === `import-rule-${rule.name}`)) return;
            buttons.unshift(
                <ActionSheetRow
                    key={`import-rule-${rule.name}`}
                    label={`Import Rule: ${rule.name}`}
                    icon={<ActionSheetRow.Icon source={DownloadIcon} />}
                    onPress={() => {
                        LazyActionSheet.hideActionSheet();
                        const currentRules = useTextReplaceSettings.getState().rules;
                        useTextReplaceSettings.getState().updateSettings({ rules: [...currentRules, rule] });
                        showToast(`Imported ${rule.name}`, DownloadIcon);
                    }}
                />,
            );
        });
    });
}
