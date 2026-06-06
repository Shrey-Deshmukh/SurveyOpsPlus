import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { projectListLabels } from '@/data/menus.dao';

export default function ProjectListOverflowMetadataScreen() {
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await projectListLabels();
        if (!cancelled) setMenuItems(items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" edges={['bottom']}>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#13a4ec" />
        </View>
      ) : (
        <ScrollView contentContainerClassName="p-4 pb-7 gap-3.5">

          <ThemedText type="title" className="text-3xl">
            Projects Menu
          </ThemedText>

          <View className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={item}
                className={`px-3 py-3.5 ${i < menuItems.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}
              >
                <ThemedText>{item}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <Link href="/(project)/create-project" asChild>
            <TouchableOpacity className="mt-2 bg-primary rounded-xl py-3.5 items-center">
              <ThemedText className="text-white text-base font-bold">Go To Create Project</ThemedText>
            </TouchableOpacity>
          </Link>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}
