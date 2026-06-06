import type { Href } from "expo-router";

import { wait } from "@/data/wait";

/** One row in the “⋯” overflow menu (label, icon, optional link). */
export type MenuRow = {
  label: string;
  icon: string;
  iconColor?: string;
  showDividerBefore?: boolean;
  href?: Href;
};

/** ⋯ menu on the Inspections (home) tab. */
export async function inspectionsMenu(): Promise<MenuRow[]> {
  await wait(200);
  return [
    {
      label: "Create Project",
      icon: "add-circle",
      iconColor: "#13a4ec",
      href: "/(project)/create-project",
    },
    {
      label: "Generate Report",
      icon: "description",
      showDividerBefore: true,
    },
    {
      label: "Upload to Cloud",
      icon: "cloud-upload",
    },
  ];
}

/** Simple list screen that shows text rows (projects menu demo). */
export async function projectListLabels(): Promise<string[]> {
  await wait(250);
  return ["Create Project", "Report Generation", "Upload to Cloud"];
}
