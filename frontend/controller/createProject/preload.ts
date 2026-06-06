// loads state and effect function for loading and setting data

import { useState } from "react";
import { formatProjectDate } from "@/controller/createProject/utils";
import { ProjectStatus } from "@/shared-types/data/project-status";
import { type RepresentingParty } from "@/shared-types/data/representing-party";
import { type CreateProjectContextDoc } from "@/controller/createProject/transforms";

export type UploadedFile = CreateProjectContextDoc;

export function useCreateProjectPreload() {
  const [projectSeedTimestamp] = useState(() => Date.now());
  const [projectName, setProjectName] = useState("");
  const [surveyDetails, setSurveyDetails] = useState("");
  const [instructions, setInstructions] = useState("");
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.Draft);
  const [location, setLocation] = useState("Unassigned");
  const [date, setDate] = useState(() => formatProjectDate(new Date()));
  const [representingParty, setRepresentingParty] = useState<
    RepresentingParty | ""
  >("");
  const [isRepresentingPartyDropdownOpen, setIsRepresentingPartyDropdownOpen] =
    useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addFiles(nextFiles: UploadedFile[]): void {
    setFiles((prev) => {
      const existingLocalUrls = new Set(prev.map((file) => file.localUrl));
      const uniqueNext = nextFiles.filter(
        (file) => !existingLocalUrls.has(file.localUrl),
      );

      return [...prev, ...uniqueNext];
    });
  }

  function removeFile(fileId: string): void {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  }

  return {
    projectSeedTimestamp,
    projectName,
    setProjectName,
    surveyDetails,
    setSurveyDetails,
    instructions,
    setInstructions,
    status,
    setStatus,
    location,
    setLocation,
    date,
    setDate,
    representingParty,
    setRepresentingParty,
    isRepresentingPartyDropdownOpen,
    setIsRepresentingPartyDropdownOpen,
    files,
    addFiles,
    removeFile,
    isSubmitting,
    setIsSubmitting,
  };
}
