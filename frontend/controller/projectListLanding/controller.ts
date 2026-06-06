// main controller for the data flow logic of the screen

import { useMemo } from "react";
import { useRouter } from "expo-router";

import { filterProjects } from "@/controller/projectListLanding/utils";
import { mapMenuRows } from "@/controller/projectListLanding/transforms";
import { useProjectsPreload } from "@/controller/projectListLanding/preload";

export function useProjectController() {
  const router = useRouter();
  const {
    projects,
    menuRows,
    loading,
    search,
    setSearch,
    menuOpen,
    setMenuOpen,
    lastOpenedId,
    setLastOpenedId,
  } = useProjectsPreload();

  const filteredProjects = useMemo(() => {
    return filterProjects(projects, search);
  }, [projects, search]);

  const overflowItems = useMemo(() => {
    return mapMenuRows(menuRows, router);
  }, [menuRows, router]);

  function openProject(id: string) {
    setLastOpenedId(id);
    router.push({
      pathname: "/(project)/project-workspace",
      params: { id },
    });
  }

  function openLastViewed() {
    if (!lastOpenedId) return;

    router.push({
      pathname: "/(project)/project-workspace",
      params: { id: lastOpenedId },
    });
  }

  return {
    router,
    search,
    setSearch,
    menuOpen,
    setMenuOpen,
    loading,
    filteredProjects,
    overflowItems,
    lastOpenedId,
    openProject,
    openLastViewed,
  };
}
