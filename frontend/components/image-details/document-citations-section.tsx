import { View, Linking } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SectionTitle } from "@/components/shared/section-title";
import type { CitationRecord } from "@/shared-types/data/citation-record";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

interface CitationBlockProps {
  icon: MaterialIconName;
  iconColor: string;
  label: string;
  children: React.ReactNode;
}

function CitationBlock({ icon, iconColor, label, children }: CitationBlockProps) {
  return (
    <ThemedView className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-3">
      <View className="flex-row items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
        <MaterialIcons name={icon} size={15} color={iconColor} />
        <ThemedText className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </ThemedText>
      </View>
      <View className="p-3 gap-2">{children}</View>
    </ThemedView>
  );
}

interface DocumentCitationsSectionProps {
  citations: CitationRecord;
}

export function DocumentCitationsSection({ citations }: DocumentCitationsSectionProps) {
  const hasManualRef =
    citations.manual_ref.length > 0 || citations.manual_ref_description.length > 0;
  const hasInternetRef =
    citations.internet_ref_links.length > 0 || citations.internet_ref_description.length > 0;

  if (!hasManualRef && !hasInternetRef) return null;

  return (
    <ThemedView className="px-4 mb-5">
      <View className="mb-3">
        <SectionTitle title="Document Citations" icon="menu-book" />
      </View>

      {hasManualRef && (
        <CitationBlock icon="article" iconColor="#6366f1" label="Compliance Manual Reference">
          {citations.manual_ref.map((ref, i) => (
            <View
              key={i}
              className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-lg p-3"
            >
              <View className="flex-row gap-2">
                <ThemedText className="text-indigo-500 dark:text-indigo-400 text-xs font-bold mt-0.5">
                </ThemedText>
                <ThemedText className="flex-1 text-xs text-indigo-900 dark:text-indigo-200 leading-5 italic">
                  "{ref}"
                </ThemedText>
              </View>
            </View>
          ))}

          {citations.manual_ref_description.map((desc, i) => (
            <View key={i} className="flex-row gap-2 px-1">
              <View className="w-1 rounded-full bg-indigo-400 dark:bg-indigo-500 self-stretch min-h-[16px]" />
              <ThemedText className="flex-1 text-xs text-slate-600 dark:text-slate-300 leading-5">
                {desc}
              </ThemedText>
            </View>
          ))}
        </CitationBlock>
      )}

      {hasInternetRef && (
        <CitationBlock icon="public" iconColor="#0ea5e9" label="External References">
          {citations.internet_ref_description ? (
            <ThemedText className="text-xs text-slate-600 dark:text-slate-300 leading-5 mb-1">
              {citations.internet_ref_description}
            </ThemedText>
          ) : null}

          {citations.internet_ref_links.map((link, i) => {
            const isUrl = link.startsWith("http://") || link.startsWith("https://");
            return (
              <View
                key={i}
                className="flex-row items-center gap-2 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/50 rounded-lg px-3 py-2"
              >
                <MaterialIcons
                  name={isUrl ? "link" : "search"}
                  size={13}
                  color="#0ea5e9"
                />
                <ThemedText
                  className="flex-1 text-xs text-sky-700 dark:text-sky-300 leading-5"
                  onPress={
                    isUrl
                      ? () => { void Linking.openURL(link); }
                      : undefined
                  }
                >
                  {link}
                </ThemedText>
              </View>
            );
          })}
        </CitationBlock>
      )}
    </ThemedView>
  );
}
