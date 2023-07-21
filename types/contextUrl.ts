export interface ContextUrlInterface {
    id: string;
    url: string;
    type: ContextUrlType;
  }
  
export type ContextUrlType = 'url' | 'file';
  