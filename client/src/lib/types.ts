export interface DocumentNode {
  id: string;
  level: number;
  content: string;
  isText: boolean;
  children: DocumentNode[];
}

export interface Footnote {
  id: string;
  content: string;
}

export interface ParsedDocument {
  title: string;
  nodes: DocumentNode[];
  footnotes: Footnote[];
}
