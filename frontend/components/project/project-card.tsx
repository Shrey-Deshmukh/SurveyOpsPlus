import type { ComponentProps } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type ProjectCardProps = {
  ref: string;
  name: string;
  status: string;
  location: string;
  surveyDetails: string | null;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  onPress: () => void;
};

type StatusStyle = {
  badge: string;
  label: string;
};

function statusStyle(status: string): StatusStyle {
  if (status === 'In Progress') {
    return {
      badge:
        'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
      label: 'text-blue-700 dark:text-blue-300',
    };
  }
  if (status === 'Completed') {
    return {
      badge:
        'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
      label: 'text-emerald-700 dark:text-emerald-300',
    };
  }
  if (status === 'Pending Upload') {
    return {
      badge:
        'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800',
      label: 'text-orange-700 dark:text-orange-300',
    };
  }
  return {
    badge: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    label: 'text-slate-600 dark:text-slate-300',
  };
}

function formatTimestamp(value?: string): string {
  if (!value) {
    return '-';
  }

  const normalized = value.includes('T')
    ? value
    : value.replace(' ', 'T') + 'Z';
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function toProjectNameSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const DETAIL_LABEL_CLASS =
  'text-[10px] uppercase tracking-wide text-slate-400 font-semibold leading-3';

function DetailCell({
  icon,
  label,
  value,
}: Readonly<{
  icon: ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string;
}>) {
  return (
    <View className="flex-row items-start gap-1.5 flex-1 min-w-0">
      <MaterialIcons name={icon} size={13} color="#94a3b8" style={{ marginTop: 6 }} />
      <View className="flex-1 min-w-0">
        <View className="h-[26px] justify-center">
          <ThemedText className={DETAIL_LABEL_CLASS} numberOfLines={2}>
            {label}
          </ThemedText>
        </View>
        <ThemedText
          className="text-[11px] text-slate-600 dark:text-slate-300 leading-4"
          numberOfLines={2}
        >
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

export function ProjectCard({
  ref,
  name,
  status,
  location,
  surveyDetails,
  date,
  createdAt,
  updatedAt,
  onPress,
}: Readonly<ProjectCardProps>) {
  const createdAtLabel = formatTimestamp(createdAt);
  const updatedAtLabel = formatTimestamp(updatedAt);
  const projectNameSlug = toProjectNameSlug(name);
  const { badge, label } = statusStyle(status);
  const description = surveyDetails?.trim() ?? '';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="mx-4 mb-2.5"
    >
      <ThemedView className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <View className="px-3.5 pt-2.5 pb-2 flex-row items-center justify-between gap-2">
          <View
            className={`rounded-full border px-2.5 py-1 ${badge}`}
          >
            <ThemedText className={`text-[11px] font-semibold ${label}`}>
              {status}
            </ThemedText>
          </View>
          <ThemedText className="text-[11px] text-slate-400 shrink">
            Created {createdAtLabel}
          </ThemedText>
        </View>

        <View className="px-3.5 pb-2.5 flex-row items-start gap-2.5">
          <View className="w-10 h-10 rounded-lg bg-sky-500/10 items-center justify-center">
            <MaterialIcons name="inventory-2" size={20} color="#0284c7" />
          </View>
          <View className="flex-1 gap-0.5 min-w-0">
            <ThemedText
              className="text-[15px] font-semibold text-slate-900 dark:text-white leading-5"
              numberOfLines={1}
            >
              {name}
            </ThemedText>
            <ThemedText
              className="text-[11px] font-medium text-sky-700 dark:text-sky-300"
              numberOfLines={1}
            >
              {ref}
            </ThemedText>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
        </View>

        <View className="px-3.5 pt-2 pb-2 border-t border-slate-100 dark:border-slate-700/80">
          <View className="flex-row items-stretch">
            <DetailCell icon="place" label="Location" value={location} />
            <View className="w-px mx-2.5 bg-slate-200 dark:bg-slate-600" />
            <DetailCell icon="event" label="Inspection Date" value={date} />
          </View>
          {description ? (
            <View className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <View className="h-[26px] justify-center">
                <ThemedText className={DETAIL_LABEL_CLASS}>Description</ThemedText>
              </View>
              <ThemedText
                className="text-[11px] text-slate-600 dark:text-slate-300 leading-4"
                numberOfLines={1}
              >
                {description}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/80 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1">
            <MaterialIcons name="update" size={13} color="#94a3b8" />
            <ThemedText
              className="text-[11px] text-slate-500 dark:text-slate-400"
              testID={`project-card-updated-${projectNameSlug}`}
              accessibilityLabel={`updated-at-raw:${updatedAt ?? ''}`}
            >
              Updated {updatedAtLabel}
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}
