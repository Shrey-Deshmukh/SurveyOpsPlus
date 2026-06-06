export type ProjectMetadataRecord = {
  id: string;
  projectId: string;
  containerId: string | null;
  vesselName: string | null;
  voyageNo: string | null;
  operator: string | null;
  portOfLoading: string | null;
  portOfDischarge: string | null;
  inspectionDate: string | null;
  inspectionTime: string | null;
  createdAt?: number;
  updatedAt?: number;
};
