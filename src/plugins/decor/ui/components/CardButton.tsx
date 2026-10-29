import { findByProps } from "@metro";
import { Forms } from "@metro/common/components";
import type { ImageSourcePropType } from "react-native";

import Card, { CardProps } from "./Card";
import Icon from "./Icon";

const { FormIcon } = Forms;
const { TextStyleSheet, Text } = findByProps("TextStyleSheet");

type CardButtonProps = Omit<CardProps, "children"> & { source: ImageSourcePropType; label: string };

export default function CardButton({ source, label, onPress, disabled, lookDisabled = false, selected = false }: CardButtonProps) {
    return (
        <Card onPress={onPress} disabled={disabled} lookDisabled={lookDisabled} selected={selected}>
            <Icon source={source} />
            <Text style={[TextStyleSheet["text-sm/medium"]]}>{label}</Text>
        </Card>
    );
}
