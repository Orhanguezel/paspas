export type AdminDocBlock =
  | {
      id: string;
      type: "heading";
      level: 3 | 4;
      text: string;
    }
  | {
      id: string;
      type: "paragraph";
      text: string;
    }
  | {
      id: string;
      type: "list";
      ordered: boolean;
      items: string[];
    }
  | {
      id: string;
      type: "code";
      language: string;
      value: string;
    };

export type AdminDocSection = {
  id: string;
  title: string;
  route?: string;
  searchText: string;
  blocks: AdminDocBlock[];
};
