import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { afterLazySheet } from "@api/ui/sheets";
import { findInReactTree } from "@lib/utils";
import { logger } from "@lib/utils/logger";
import { React } from "@metro/common";
import { ActionSheetRow as BaseActionSheetRow, Forms } from "@metro/common/components";
import { findByPropsLazy } from "@metro/wrappers";

import { openQuoteModal } from "../components/QuotePreview";

const LazyActionSheet = findByPropsLazy("openLazy", "hideActionSheet");

const styles = {
    iconComponent: {
        width: 24,
        height: 24,
        tintColor: semanticColors.INTERACTIVE_NORMAL,
    },
};

function injectQuoteRow(sheet: any, message: any) {
    const icon = findAssetId("QuoteIcon") ?? findAssetId("ImageIcon") ?? findAssetId("ChatXIcon");
    const onPress = () => {
        LazyActionSheet.hideActionSheet();
        openQuoteModal(message);
    };

    const actionSheetContainer = findInReactTree(
        sheet,
        x => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup",
    );

    const middleGroup = actionSheetContainer?.[1];
    const children = middleGroup?.props?.children;

    if (Array.isArray(children) && children.length) {
        if (children.some((child: any) => child?.key === "quoter")) return;

        const template = children.find((child: any) => child?.type);
        if (!template) return;

        const ActionSheetRow = template.type;
        const templateIcon = template.props?.icon;
        const quoteButton = (
            <ActionSheetRow
                label="Quote"
                icon={<BaseActionSheetRow.Icon source={icon} />}
                onPress={onPress}
                key="quoter"
            />
        );

        const copyIndex = children.findIndex((child: any) =>
            child?.props?.label?.toUpperCase?.()?.includes("COPY") ||
            child?.props?.message?.toUpperCase?.()?.includes("COPY")
        );

        if (copyIndex !== -1) {
            children.splice(copyIndex, 0, quoteButton);
        } else {
            children.push(quoteButton);
        }
        return;
    }

    const buttons = findInReactTree(
        sheet,
        x => x?.[0]?.type?.name === "ButtonRow",
    );

    if (Array.isArray(buttons)) {
        if (buttons.some((child: any) => child?.key === "quoter")) return;
        const { FormRow, FormIcon } = Forms;
        buttons.push(
            <FormRow
                key="quoter"
                label="Quote"
                leading={<FormIcon style={{ opacity: 1 }} source={icon} />}
                onPress={onPress}
            />,
        );
    } else {
        logger.log("[Quoter] Could not find a known ActionSheet layout");
    }
}

export default () => afterLazySheet("MessageLongPressActionSheet", ([props], sheet) => {
    if (props?.message?.content) injectQuoteRow(sheet, props.message);
});
