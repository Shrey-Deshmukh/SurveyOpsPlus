//Single document citation extracted by LLM from extract features pipeline
export type CitationRecord = {
  /** Direct quote(s) from the compliance document with page reference. */
  manual_ref: string[];
  /** Explanation of how each manual quote applies to the observed violation. */
  manual_ref_description: string[];
  /** Internet search queries or URLs related to the violation. */
  internet_ref_links: string[];
  /** Summary description of what the internet references cover. */
  internet_ref_description: string;
};
