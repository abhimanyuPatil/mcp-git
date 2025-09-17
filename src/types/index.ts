export interface GitLogOptions {
  repo?: string;
  number?: number;
  author?: string;
  since?: string;
  until?: string;
  fields?: string[];
}

export interface GitCommit {
  hash: string;
  abbrevHash: string;
  subject: string;
  authorName: string;
  authorEmail: string;
  authorDate: string;
  authorDateRel: string;
  body: string;
}

export interface KimaiEntry {
  begin: string;
  end: string;
  project: number;
  activity: number;
  description: string;
}

export interface TimeSheetEntry {
  activity: number;
  project: number;
  user: number;
  tags: string[];
  id: number;
  begin: string;
  end: string;
  duration: number;
  description: string;
  rate: number;
  internalRate: number;
  fixedRate: number;
  hourlyRate: number;
  exported: boolean;
  billable: boolean;
  metaFields: {
    name: string;
    value: string;
  }[];
}
