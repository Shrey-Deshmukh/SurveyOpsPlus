import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';

const TAB_ACTIVE = '#13a4ec';
const TAB_INACTIVE_LIGHT = '#94a3b8';
const TAB_INACTIVE_DARK = '#64748b';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TAB_ACTIVE,
        tabBarInactiveTintColor: isDark ? TAB_INACTIVE_DARK : TAB_INACTIVE_LIGHT,
        tabBarStyle: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderTopColor: isDark ? '#1e293b' : '#e2e8f0',
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="assignment" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}