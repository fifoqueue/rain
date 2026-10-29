import { Forms } from "@metro/common/components";
import type { ImageSourcePropType } from "react-native";

const { FormIcon } = Forms;

export default ({ source }: { source: ImageSourcePropType }) => <FormIcon source={source} style={{ opacity: 1 }} />;
