export interface DocumentNode {
  id: string;
  level: number;
  content: string;
  isText: boolean;
  inTextLevel?: boolean; // Novo atributo para identificar se está dentro de {{text_level}}
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
