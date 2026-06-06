// containes data transformation methods, pure

import type { MenuRow } from "@/data/menus.dao";
import type { Href, Router } from "expo-router";
import type { ComponentProps } from "react";
import { MaterialIcons } from "@expo/vector-icons";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

export function createNavigateHandler(router: Router, href: Href) {
  return function handlePress() {
    router.push(href);
  };
}

export function mapMenuRowToItem(row: MenuRow, router: Router) {
  return {
    label: row.label,
    icon: row.icon as MaterialIconName,
    iconColor: row.iconColor,
    showDividerBefore: row.showDividerBefore,
    onPress: row.href
      ? createNavigateHandler(router, row.href as Href)
      : undefined,
  };
}

export function mapMenuRows(rows: MenuRow[], router: Router) {
  return rows.map((row) => mapMenuRowToItem(row, router));
}
