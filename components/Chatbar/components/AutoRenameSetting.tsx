import { IconCheck, IconTrash, IconX } from '@tabler/icons-react';
import { FC, useState, useContext } from 'react';

import { useTranslation } from 'next-i18next';

import { SidebarButton } from '@/components/Sidebar/SidebarButton';
import HomeContext from '@/pages/api/home/home.context';

interface Props {
}

export const AutoRenameSetting: FC<Props> = ({  }) => {
  const {
    state: {
      isEnabledAutoRename
    },
    handleUpdateAutoRename
  } = useContext(HomeContext);
  const { t } = useTranslation('sidebar');

    return (
      <SidebarButton
        text={t('Auto Rename')}
        icon={isEnabledAutoRename ? <IconCheck size={18} className='text-green-500'/> : <IconX size={18}  className='text-red-500'/>}
        onClick={() => handleUpdateAutoRename(!isEnabledAutoRename)}
      />
    );
};
