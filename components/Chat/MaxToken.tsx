import { FC, useContext } from 'react';

import { useTranslation } from 'next-i18next';

import HomeContext from '@/pages/api/home/home.context';

interface Props {
}

export const MaxToken: FC<Props> = () => {
  const {
    state: {
      selectedConversation
    },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  const { t } = useTranslation('chat');
  
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if(selectedConversation)
    handleUpdateConversation(selectedConversation, {
        key: 'model',
        value: {
            ...selectedConversation.model,
            tokenLimit: event.target.value
        }
      });
  };

  return (
    <div className="flex flex-col text-black">
      <label className="mb-2 text-left text-neutral-700 ">
        {t("Max Tokens in Response")}
      </label>
      <span className="text-[12px] text-black/50 mb-1">
        {t('The maximum number of tokens to generate in the reply. 1000 tokens are roughly 750 English words.')}
      </span>
      <div className="w-full flex relative">
        <input type="number" step="1" min="1500" max="10000" className="border w-full rounded-lg h-10 inline-flex items-center px-3 focus:ring outline-none bg-white dark:bg-transparent focus:border-blue-400 ring-blue-400 read-only:focus:ring-0 dark:text-white dark:ring-blue-600 dark:focus:border-blue-600" onChange={handleChange} value={selectedConversation?.model.tokenLimit} />
      </div>
    </div>
  );
};