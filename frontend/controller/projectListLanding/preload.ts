// loads state and effect function for loading and setting data

import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { inspectionsMenu, type MenuRow } from "@/data/menus.dao";
import { loadHome } from "@/data/projects.dao";
import { type ProjectRecord } from "@/shared-types/data/project-record";

export function useProjectsPreload() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [menuRows, setMenuRows] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastOpenedId, setLastOpenedId] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadData() {
        if (!hasLoadedOnceRef.current) {
          setLoading(true);
        }

        try {
          const [home, menu] = await Promise.all([loadHome(), inspectionsMenu()]);
          if (!isActive) {
            return;
          }

          setProjects(home.projects);
          setMenuRows(menu);
          hasLoadedOnceRef.current = true;
        } catch (error) {
          console.error("[ProjectsPreload] Failed to load project list", error);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      void loadData();

      return () => {
        isActive = false;
      };
    }, []),
  );

  return {
    projects,
    menuRows,
    loading,
    search,
    setSearch,
    menuOpen,
    setMenuOpen,
    lastOpenedId,
    setLastOpenedId,
  };
}
