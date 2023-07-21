import { FC, useContext, useState, useRef, useEffect } from 'react';

import { useTranslation } from 'next-i18next';

import { DEFAULT_TEMPERATURE, HOST_NAME } from '@/utils/app/const';

import HomeContext from '@/pages/api/home/home.context';
import { ContextUrlInterface } from '@/types/contextUrl';
import { IconTrash } from '@tabler/icons-react';
import useApiService from '@/services/useApiService';
import { v4 as uuid } from 'uuid';

interface Props {
}

export const ContextUrls: FC<Props> = () => {
  const {
    state: {
      selectedConversation
    },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  const { t } = useTranslation('chat');
  const [contextUrls, setContextUrls] = useState<ContextUrlInterface[]>([]);
  const hiddenFileInput = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, id: string) => {
    handleChangeContextUrl(id, event.target.value);
  };

  const handleChangeContextUrl = (
    id: string,
    value: string
  ) => {
    let contextUrlsTemp = contextUrls.map((contextUrl) => {
      if(contextUrl.id === id)
        return {...contextUrl, url: value};
      return contextUrl;
    });
    updateContextUrls(contextUrlsTemp);
  }

  const updateContextUrls = (urls: ContextUrlInterface[]) => {
    setContextUrls(urls);
    if(selectedConversation) {
      handleUpdateConversation(selectedConversation, {
        key: 'contextUrls',
        value: urls
      });
      homeDispatch({ field: 'contextUrlChanged', value: true });
    }
    
  }

  const uploadToClient = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      try {
        var formData = new FormData();
        formData.append("media", file);
  
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
  
        const {
          data,
          error,
        }: {
          data: {
            url: string;
          } | null;
          error: string | null;
        } = await res.json();
        
        if (error || !data) {
          alert(error || "Sorry! something went wrong.");
          return;
        }
        const word: string = 'public';
        const fileUrl: string = HOST_NAME + data.url.split(word)[1].replace(/\\/gi, '/');
        event.target.value = "";
        handleNewContextFile(fileUrl);
      } catch (error) {
        console.error(error);
        alert("Sorry! something went wrong.");
      }
      
    }
  };
  
  const triggerFileInput = async () => {
    hiddenFileInput.current?.click();
  };

  const handleNewContextUrl = () => {
    const contextUrlsTemp: ContextUrlInterface[] = [...contextUrls, {
      id: uuid(),
      type: 'url',
      url: '',
    }]
    updateContextUrls(contextUrlsTemp);
  }

  const handleNewContextFile = (value: string) => {
    const contextUrlsTemp: ContextUrlInterface[] = [...contextUrls, {
      id: uuid(),
      type: 'file',
      url: value
    }];
    updateContextUrls(contextUrlsTemp);
  }

  const handleRemoveContextUrl = (
    id: string
  ) => {
    const contextUrlsTemp = contextUrls.filter(contextUrl => contextUrl.id !== id);
    updateContextUrls(contextUrlsTemp);
  }

  

  useEffect(() => {
    if(selectedConversation) {
      setContextUrls(selectedConversation.contextUrls ? selectedConversation.contextUrls : []);
    }
  }, [selectedConversation]);
  
  return (
    <div className="flex flex-col text-black">
      <label className="mb-2 text-left text-neutral-700 ">
        {t("Contexts")}
      </label>
      <span className="text-[12px] text-black/50 mb-1">
        {t(
          'You can ask questions about the contents in theses URLs and documents.',
        )}
      </span>
      <div className='flex flex-col gap-2 mb-2'>
        {
          contextUrls.map((contextUrl) => 
          <div className='flex gap-2' key={contextUrl.id}>
            <div className='w-full flex relative'>
              <input
                className="border w-full rounded-lg h-10 inline-flex items-center px-3 focus:ring outline-none bg-white dark:bg-transparent focus:border-blue-400 ring-blue-400 read-only:focus:ring-0 dark:text-white dark:ring-blue-600 dark:focus:border-blue-600"
                type="text"
                value={contextUrl.url}
                onChange={(e) => handleChange(e, contextUrl.id)}
              />
            </div>
            <button type='button' className='rounded-lg px-2 text-sm inline-flex items-center justify-center shrink-0 text-center disabled:pointer-events-none border-zinc-300 border-b-zinc-400/80 dark:bg-zinc-800 dark:border-zinc-600 dark:active:bg-zinc-900 h-10 bg-red-100 border-0 text-red-500 font-medium ring-red-300 active:bg-red-200' onClick={() => handleRemoveContextUrl(contextUrl.id)}>
              <IconTrash size={14} className='mr-1'/>{t('Remove')}
            </button>
          </div>
          )}
      </div>
      <div className="space-x-1">
        <button type="button" className="rounded-lg px-2 text-sm h-6 inline-flex items-center justify-center border shrink-0 text-center disabled:pointer-events-none border-zinc-300 bg-white border-b-zinc-400/80 active:bg-zinc-200" onClick={handleNewContextUrl}>Add URL</button>
        <button type="button" className="rounded-lg px-2 text-sm h-6 inline-flex items-center justify-center border shrink-0 text-center disabled:pointer-events-none border-zinc-300 bg-white border-b-zinc-400/80 active:bg-zinc-200" onClick={triggerFileInput}>Upload File</button>
        <input type="file" name="myImage" onChange={uploadToClient} ref={hiddenFileInput} hidden accept=".xbl, .xsl, .text, .xslt, .txt"/>
      </div>
    </div>
  );
};
