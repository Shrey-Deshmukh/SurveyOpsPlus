import {
  ActivityIndicator,
  Image,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import type { ImageRecord } from "@/shared-types/data/image-record";

type DotSize = "sm" | "md";

const DOT_SIZES: Record<DotSize, { outer: number; icon: number }> = {
  sm: { outer: 16, icon: 10 },
  md: { outer: 22, icon: 14 },
};

type TaggingStatusDotProps = Readonly<{
  image: ImageRecord;
  size?: DotSize;
}>;

/** Small white circle: green check when tagged, red X when not tagged, spinner while in progress. */
export function TaggingStatusDot({ image, size = "md" }: TaggingStatusDotProps) {
  const { outer, icon } = DOT_SIZES[size];
  const tagged = image.taggingStatus === "tagged";
  const inProgress = image.taggingStatus === "in_progress";

  let label = "Not tagged";
  if (tagged) label = "Tagged";
  else if (inProgress) label = "Tagging in progress";

  return (
    <View
      className="rounded-full bg-white items-center justify-center"
      style={{
        width: outer,
        height: outer,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2,
        elevation: 3,
      }}
      pointerEvents="none"
      accessibilityLabel={label}
    >
      {inProgress ? (
        <ActivityIndicator
          size="small"
          color="#13a4ec"
          style={{
            transform: [{ scale: size === "sm" ? 0.55 : 0.75 }],
          }}
        />
      ) : tagged ? (
        <MaterialIcons name="check" size={icon} color="#16a34a" />
      ) : (
        <MaterialIcons name="close" size={icon} color="#dc2626" />
      )}
    </View>
  );
}

type ImageCardProps = Readonly<{
  image: ImageRecord;
  onPress: () => void;
  selectable?: boolean;
  selected?: boolean;
}>;

export function ImageCard({
  image,
  onPress,
  selectable = false,
  selected = false,
}: ImageCardProps) {
  return (
    <View
      className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800"
      style={{
        width: "48%",
        aspectRatio: 1,
        borderWidth: selectable && selected ? 2 : 0,
        borderColor: selectable && selected ? "#005ea4" : "transparent",
      }}
    >
      <TouchableOpacity
        style={{ flex: 1 }}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <Image
          source={{ uri: image.localUrl }}
          className="w-full h-full absolute"
          resizeMode="cover"
        />
        {selectable && selected && (
          <View className="absolute top-2 left-2 rounded-full bg-[#005ea4] p-1">
            <MaterialIcons name="check" size={16} color="#fff" />
          </View>
        )}
        <View className="absolute bottom-1.5 right-1.5">
          <TaggingStatusDot image={image} />
        </View>
      </TouchableOpacity>
    </View>
  );
}
