export interface MediaFile {
  id: string;
  url: string;
  contentType: string;
  size: number;
  uploadDate: string;
  originalFileName?: string;
  folder?: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId?: string;
  children?: MediaFolder[];
  fileCount?: number;
}

export type ViewMode = 'grid' | 'list';

export type SortBy = 'name' | 'size' | 'date';
export type SortOrder = 'asc' | 'desc';
