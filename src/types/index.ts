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
