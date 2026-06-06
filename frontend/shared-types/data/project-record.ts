import { type RepresentingParty } from "@/shared-types/data/representing-party";

export type ProjectRecord = {
  id: string;
  ref: string;
  name: string;
  surveyDetails: string | null;
  instructions: string | null;
  status: string;
  location: string;
  date: string;
  representingParty: RepresentingParty | null;
  createdAt?: string;
  updatedAt?: string;
};
