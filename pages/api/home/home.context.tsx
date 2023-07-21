import { Dispatch, createContext } from 'react';

import { ActionType } from '@/hooks/useCreateReducer';

import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { FolderType } from '@/types/folder';

import { HomeInitialState } from './home.state';

export interface HomeContextProps {
  state: HomeInitialState;
  dispatch: Dispatch<ActionType<HomeInitialState>>;
  handleNewConversation: (folderId?: string | null) => void;
  handleCreateFolder: (type: FolderType) => void;
  handleDeleteFolder: (folderId: string) => void;
  handleUpdateFolder: (folderId: string, name: string) => void;
  handleSelectConversation: (conversation: Conversation) => void;
  handleUpdateConversation: (
    conversation: Conversation,
    data: KeyValuePair,
  ) => void;
  handleUpdateUserAvatar: (url: string) => void;
  handleUpdateAutoRename: (val: boolean) => void;
  handleCreatePromptModal: (name: string, description: string, content: string) => void;
  initConversations: () => void;
}

const HomeContext = createContext<HomeContextProps>(undefined!);

export default HomeContext;
