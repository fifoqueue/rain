import { findAssetId } from "@api/assets";
import { lazyDestructure } from "@lib/utils/lazy";
import { React, ReactNative, toasts } from "@metro/common";
import { findByProps } from "@metro/wrappers";
import { Strings } from "@rain/i18n";
import type { ImageProps, ImageSourcePropType } from "react-native";

const { uuid4 } = lazyDestructure(() => findByProps("uuid4"));

export const showToast = (content: string, asset?: ImageSourcePropType) => toasts.open(`rain-toast-${uuid4()}`, {
    text: content,
    icon: asset == null ? undefined : ({ style }: ImageProps) => React.createElement(ReactNative.Image, {
        source: asset,
        style: [{ width: 24, height: 24 }, style],
    }),
});

showToast.showCopyToClipboard = (message = Strings.COPIED_TO_CLIPBOARD) => {
    showToast(message, findAssetId("toast_copy_link"));
};
