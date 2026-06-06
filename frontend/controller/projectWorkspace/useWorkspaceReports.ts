import { useCallback } from "react";
import { Alert } from "react-native";

import { mimeTypeForReportFileName } from "@/controller/projectWorkspace/transforms";
import {
  openLocalDocument,
  shareLocalDocuments,
} from "@/controller/utils/document-utils";
import type { Report } from "@/data/workspace.dao";

function shareMimeTypeForReports(reports: Report[]): string {
  const mimeTypes = new Set(
    reports.map((report) => mimeTypeForReportFileName(report.name)),
  );
  return mimeTypes.size === 1 ? [...mimeTypes][0]! : "*/*";
}

export function useWorkspaceReports() {
  const handleOpenReport = useCallback(async (report: Report) => {
    if (!report.localUrl) {
      Alert.alert("Unavailable", "This report has no local file.");
      return;
    }

    try {
      await openLocalDocument(
        report.localUrl,
        mimeTypeForReportFileName(report.name),
      );
    } catch (error) {
      console.error("[Workspace] Failed to open report", error);
      Alert.alert(
        "Unable to Open",
        "No app could open this report. Try sharing it to another app.",
      );
    }
  }, []);

  const handleExportReports = useCallback(async (reports: Report[]) => {
    const exportable = reports.filter(
      (report): report is Report & { localUrl: string } => Boolean(report.localUrl),
    );

    if (exportable.length === 0) {
      Alert.alert("Unavailable", "This report has no local file.");
      return;
    }

    try {
      await shareLocalDocuments(
        exportable.map((report) => report.localUrl),
        shareMimeTypeForReports(exportable),
      );
    } catch (error) {
      console.error("[Workspace] Failed to export reports", error);
      Alert.alert(
        "Unable to Export",
        "Could not open the share sheet. Try again or export reports individually.",
      );
    }
  }, []);

  return {
    handleOpenReport,
    handleExportReports,
  };
}
