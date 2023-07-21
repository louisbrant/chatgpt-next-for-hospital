import { IconFileExport, IconSettings } from '@tabler/icons-react';
import { useContext, useState } from 'react';

import { useTranslation } from 'next-i18next';

import HomeContext from '@/pages/api/home/home.context';

import { SettingDialog } from '@/components/Settings/SettingDialog';

import { Import } from '../../Settings/Import';
import { Key } from '../../Settings/Key';
import { SidebarButton } from '../../Sidebar/SidebarButton';
import ChatbarContext from '../Chatbar.context';
import { ClearConversations } from './ClearConversations';
import { PluginKeys } from './PluginKeys';

import { DropdownMenu } from './DropdownMenu';
import { IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import { AutoRenameSetting } from './AutoRenameSetting';

export const ChatbarSettings = () => {
  const { t } = useTranslation('sidebar');
  const [isSettingDialogOpen, setIsSettingDialog] = useState<boolean>(false);
  const [showSettingPanel, setShowSettingPanel] = useState(true);

  const {
    state: {
      apiKey,
      lightMode,
      serverSideApiKeyIsSet,
      serverSidePluginKeysSet,
      conversations,
      folders
    },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const {
    handleClearConversations,
    handleImportConversations,
    handleExportData,
    handleApiKeyChange,
  } = useContext(ChatbarContext);

  const handleShowSetting = () => {
    setShowSettingPanel( !showSettingPanel );
  }

  return (
    <div className='w-full'>
      <div className="flex flex-col items-center space-y-1 border-t border-black/20 pt-1 text-sm">
        <div className="chatbarSettingArrowDiv " style={{cursor:"pointer"}} onClick={handleShowSetting}>
          {!showSettingPanel ? <IconChevronUp className="mx-auto" color={"black"}/> :
          <IconChevronDown className="mx-auto" color={"black"}/> }
        </div>
        <div className={`w-full ${showSettingPanel ? "" : "hidden"}`}>
          <AutoRenameSetting />
          {/* {conversations.length > 1 || (conversations.length === 1 && conversations[0].messages.length > 0) || (folders.filter((f) => f.type === 'chat').length > 0) &&
            <ClearConversations onClearConversations={handleClearConversations} />
          } */}
          <ClearConversations onClearConversations={handleClearConversations} />

          {!serverSideApiKeyIsSet ? (
            <Key apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
          ) : null}
        </div>

      </div>
    </div>
  );
};
