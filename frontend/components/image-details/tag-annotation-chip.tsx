import { TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { NEEDS_ATTENTION_REGEX } from "@/db/api/tags/constants";

const CHIP_BASE =
  "flex-row items-start gap-1.5 self-start px-3 py-2 rounded-lg border ";

const VARIANT = {
  attention: {
    chip: `${CHIP_BASE}bg-red-500/10 border-red-500/30`,
    text: "text-sm text-red-600 dark:text-red-400",
    icon: "#ef4444",
  },
  normal: {
    chip: `${CHIP_BASE}bg-primary/10 border-primary/20`,
    text: "text-sm text-primary",
    icon: "#13a4ec",
  },
} as const;

/** Display text, Tailwind classes, and test id slug for one annotation tag. */
function tagChipModel(raw: string) {
  const needsAttention = NEEDS_ATTENTION_REGEX.test(raw);
  const display = needsAttention
    ? raw.replace(NEEDS_ATTENTION_REGEX, "").trim()
    : raw;
  const v = needsAttention ? VARIANT.attention : VARIANT.normal;
  const testSlug = display
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return { display, chipClass: v.chip, textClass: v.text, iconColor: v.icon, testSlug };
}

type TagAnnotationChipProps = Readonly<{
  tag: string;
  index: number;
  onRemoveAt: (index: number) => void;
}>;

export function TagAnnotationChip({
  tag,
  index,
  onRemoveAt,
}: TagAnnotationChipProps) {
  const c = tagChipModel(tag);

  return (
    <View
      className={c.chipClass}
      style={{ maxWidth: "100%" }}
      testID={`image-details-tag-chip-${c.testSlug}`}
    >
      <ThemedText className={`${c.textClass} shrink`} style={{ flexShrink: 1 }}>
        {c.display}
      </ThemedText>
      <TouchableOpacity
        className="shrink-0 pt-0.5"
        onPress={() => onRemoveAt(index)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons name="close" size={14} color={c.iconColor} />
      </TouchableOpacity>
    </View>
  );
}
