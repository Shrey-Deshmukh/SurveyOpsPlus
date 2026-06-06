import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ProjectCard } from "@/components/project/project-card";
import { ScreenHeader } from "@/components/shared/screen-header";
import { useProjectController } from "@/controller/projectListLanding/controller";

export default function ProjectsScreen() {
  const [searchOpen, setSearchOpen] = useState(false);
  const {
    router,
    search,
    setSearch,
    loading,
    filteredProjects,
    openProject,
  } = useProjectController();

  function openCreateProject() {
    router.push("/(project)/create-project");
  }

  function openSearch() {
    setSearchOpen(true);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearch("");
  }

  function toggleSearch() {
    if (searchOpen) {
      closeSearch();
    } else {
      openSearch();
    }
  }

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-slate-900"
      edges={["top"]}
      testID="landing-screen"
    >
      <ScreenHeader
        title="Inspections"
        titleClassName="text-3xl"
        rightSlot={
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center"
              onPress={toggleSearch}
              accessibilityRole="button"
              accessibilityLabel={searchOpen ? "Close search" : "Open search"}
            >
              <MaterialIcons
                name={searchOpen ? "close" : "search"}
                size={24}
                color="#94a3b8"
              />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center gap-1.5 rounded-lg border-2 border-sky-500 bg-sky-100 dark:bg-sky-500/20 px-3 py-2"
              onPress={openCreateProject}
              accessibilityRole="button"
              accessibilityLabel="Start a project"
              activeOpacity={0.85}
            >
              <MaterialIcons name="add" size={18} color="#0284c7" />
              <ThemedText className="text-sky-700 dark:text-sky-300 text-sm font-semibold">
                Start a project
              </ThemedText>
            </TouchableOpacity>
          </View>
        }
      />

      {searchOpen ? (
        <ThemedView className="mx-4 mb-2 flex-row items-center gap-2 px-3 h-12 rounded-xl border border-slate-200 dark:border-slate-700">
          <MaterialIcons name="search" size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 text-base text-slate-900 dark:text-white"
            placeholder="Search project ID..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </ThemedView>
      ) : null}

      {loading ? (
        <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900">
          <ActivityIndicator size="large" color="#13a4ec" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 bg-slate-50 dark:bg-slate-900"
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              ref={project.ref}
              name={project.name}
              status={project.status}
              location={project.location}
              surveyDetails={project.surveyDetails}
              date={project.date}
              createdAt={project.createdAt}
              updatedAt={project.updatedAt}
              onPress={() => openProject(project.id)}
            />
          ))}
        </ScrollView>
      )}

      <TouchableOpacity
        className="absolute right-5 bottom-6 w-14 h-14 rounded-full bg-sky-500 items-center justify-center shadow-md"
        onPress={openCreateProject}
        accessibilityRole="button"
        accessibilityLabel="Create project"
        activeOpacity={0.88}
        testID="landing-create-project-button"
      >
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
