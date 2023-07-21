export interface FolderInterface {
  id: string;
  name: string;
  chatsNumber?: number;
  type: FolderType;
  color?: string;
  hoverColor?: string;
}

export type FolderType = 'chat' | 'prompt';
