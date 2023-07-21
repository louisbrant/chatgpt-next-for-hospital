import { IconExternalLink } from '@tabler/icons-react';
import { useContext, useEffect, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { OpenAIModel } from '@/types/openai';

import HomeContext from '@/pages/api/home/home.context';
import { ContextUrls } from './ContextUrls';
import { MaxToken } from './MaxToken';
import { useSSR } from 'react-i18next';
import { SiOpenai } from '@icons-pack/react-simple-icons';

export const ModelSelect = () => {
  const { t } = useTranslation('chat');

  const {
    state: { selectedConversation, models, defaultModelId },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [selectedModelId, setSelectedModelId] = useState<string>(selectedConversation?.model?.id ? selectedConversation.model.id : (defaultModelId ? defaultModelId : ""));

  const handleSelectModel = (id: string) => {
    if(selectedConversation ) {
      handleUpdateConversation(selectedConversation, {
        key: 'model',
        value: models.find(
          (model) => model.id === id,
        ) as OpenAIModel,
      });
      setSelectedModelId(id);
    }
      
  }

  const modelColors = ['bg-[#4aa181]', 'bg-[#a26bf7]'];

  return (
    <div className="flex flex-col">
      <label className="mb-3 text-left text-neutral-700 ">
        {t('Model')}
      </label>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-2 text-gray-800" role="none">
        {models.map((model, index) => (
          <div key={model.id} className={`${selectedModelId === model.id ? 'border-blue-600' : 'border-gray-300'}  cursor-pointer border-2 relative flex rounded-lg border bg-white p-4 shadow-sm focus:outline-none w-full`}  onClick={() => handleSelectModel(model.id)}>
            <div className="flex flex-1 w-full">
              <div className="flex justify-between items-center w-full">
                <span className="block text-sm font-medium  flex items-center justify-center gap-2" id="headlessui-label-:r2d:">
                  <div className={`p-0.5 w-6 h-6 ${modelColors[index%2]} text-white`}>
                    <SiOpenai size={20} />
                  </div>
                  <span className="whitespace-nowrap">{model.name}</span>
                </span>
                <div className="text-sm hidden sm:block  text-gray-500" id="headlessui-description-:r3g:">{model.id === "gpt-3.5-turbo" ? "Fast" : (model.id === "gpt-4" ? "Smart" : "")}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full mt-4 text-left text-neutral-700 flex items-center">
        <a
          href="https://platform.openai.com/account/usage"
          target="_blank"
          className="flex items-center"
        >
          <IconExternalLink size={18} className={'inline mr-1'} />
          {t('View Account Usage')}
        </a>
      </div>
      <div className='mt-4'>
        <MaxToken />
      </div>
      <div className='mt-4'>
        <ContextUrls />
      </div>
    </div>
  );
};
