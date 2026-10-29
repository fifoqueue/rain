import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { findByName } from "@metro";

import type { Decoration } from "../../lib/api";
import { useCurrentUserDecorationsStore } from "../../lib/stores/CurrentUserDecorationsStore";
import discordifyDecoration from "../../lib/utils/discordifyDecoration";
import showDecorationActionSheet from "../../lib/utils/showDecorationActionSheet";
import Card, { CardProps } from "./Card";


const CutoutableAvatarDecoration = findByName("CutoutableAvatarDecoration");

interface DecorationCardProps {
    decoration: Decoration;
    onPress?: CardProps["onPress"];
    selectable?: boolean;
    disabled?: boolean;
}

export default function DecorationCard({ decoration, onPress, selectable, disabled }: DecorationCardProps) {
    const selectedDecoration = useCurrentUserDecorationsStore(s => s.selectedDecoration);
    const select = useCurrentUserDecorationsStore(s => s.select);
    selectable ??= decoration.reviewed === null || decoration.reviewed === true;
    onPress ??= selectable ? () => select(decoration) : () => showToast("This decoration has not been approved yet.", findAssetId("img_none"));
    const selected = selectedDecoration?.hash === decoration.hash;
    return (
        <Card
            onPress={onPress}
            onLongPress={() => showDecorationActionSheet(decoration)}
            selected={selected}
            disabled={disabled}
            lookDisabled={!selectable}
        >
            <CutoutableAvatarDecoration avatarDecoration={discordifyDecoration(decoration)} size={56} animate={selected} />
        </Card>
    );
}
