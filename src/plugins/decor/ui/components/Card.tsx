import { semanticColors } from "@api/ui/components/color";
import { createStyles } from "@api/ui/styles";
import { findByProps } from "@metro";
import { ReactNative } from "@metro/common";
import type { GestureResponderEvent, TouchableOpacityProps } from "react-native";


const { View, TouchableOpacity } = ReactNative;

const { triggerHapticFeedback, HapticFeedbackTypes } = findByProps("triggerHapticFeedback");

const useStyles = createStyles(_ => ({
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: semanticColors.BACKGROUND_FLOATING,
        width: 72,
        height: 72,
        borderRadius: 4
    },
    inner: {
        display: "flex",
        justifyContent: "space-evenly",
        alignItems: "center"
    },
    selected: {
        borderWidth: 2,
        borderColor: semanticColors.BUTTON_OUTLINE_BRAND_BORDER_ACTIVE
    },
    disabled: {
        opacity: 0.5
    }
}));

const hapticFeedbackWrapper = (fn: NonNullable<TouchableOpacityProps["onPress"]>, event: GestureResponderEvent) => {
    triggerHapticFeedback(HapticFeedbackTypes.IMPACT_LIGHT);
    fn(event);
};

export type CardProps = Pick<TouchableOpacityProps, "onPress" | "onLongPress" | "disabled" | "children"> & {
    lookDisabled?: boolean;
    selected?: boolean;
};

export default function Card({
    onPress = undefined,
    onLongPress = undefined,
    disabled = undefined,
    lookDisabled = undefined,
    selected = false,
    children
}: CardProps) {
    const styles = useStyles();
    return (
        <TouchableOpacity
            onPress={onPress ? event => hapticFeedbackWrapper(onPress, event) : undefined}
            onLongPress={onLongPress ? event => hapticFeedbackWrapper(onLongPress, event) : undefined}
            disabled={disabled}
        >

            <View style={[styles.container, selected ? styles.selected : null]}>
                <View style={[styles.inner, (disabled || lookDisabled) && styles.disabled]}>{children}</View>
            </View>
        </TouchableOpacity>
    );
    /*
	return (
		<TouchableOpacity
			onPress={onPress ? () => hapticFeedbackWrapper(onPress) : undefined}
			onLongPress={onLongPress ? () => hapticFeedbackWrapper(onLongPress) : undefined}
			disabled={disabled}
		>
			<View style={[styles.container, selected ? styles.selected : null]}>
				<View style={[styles.inner, (disabled || lookDisabled) && styles.disabled]}>{children}</View>
			</View>
		</TouchableOpacity>
	);

	 */
}
