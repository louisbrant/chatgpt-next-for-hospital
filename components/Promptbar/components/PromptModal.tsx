import { FC, KeyboardEvent, useEffect, useRef, useState, useContext } from 'react';

import { useTranslation } from 'next-i18next';

import { Prompt } from '@/types/prompt';
import PromptbarContext from '../PromptBar.context';
import HomeContext from '@/pages/api/home/home.context';
import Modal from 'react-modal';
import { IconX } from '@tabler/icons-react';

Modal.setAppElement('#__next');

interface Props {
  prompt: Prompt | null;
  onClose: () => void;
  onUpdatePrompt: (prompt: Prompt) => void;
  showModal: boolean;
}


export const PromptModal: FC<Props> = ({ prompt, onClose, onUpdatePrompt, showModal }) => {
  const { t } = useTranslation('promptbar');
  const [name, setName] = useState(prompt ? prompt.name : "");
  const [description, setDescription] = useState(prompt ? prompt.description: "");
  const [content, setContent] = useState(prompt ? prompt.content : "");
  const [modalHeight, setModalHeight] = useState<number>(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const {
    handleCreatePromptModal
  } = useContext(HomeContext);

  const handleEnter = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSavePrompt();
    }
  };

  const handleSavePrompt = () => {
    if(prompt) {
      onUpdatePrompt({ ...prompt, name, description, content: content.trim() });
    }
    else {
      handleCreatePromptModal(name, description, content);
    }
    setName('');
    setDescription('');
    setContent('');
    onClose();
  }

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if(modalRef.current) {
      const height = modalRef.current.clientHeight;
      setModalHeight(height);
    }
  });

  return (
    <Modal 
      isOpen={showModal}
      onRequestClose={onClose}
      className={`rounded-lg border border-gray-300 bg-white text-left align-bottom overflow-y-auto sm:my-4 sm:min-w-[600px] p-4 h-full sm:h-fit ${window.innerHeight < modalHeight && 'modal-full-height'}`}
    >
      <div ref={modalRef}>
        <form onSubmit={handleSavePrompt}>
          <div className='flex justify-between items-center'>
            <h2 className="text-slate-900 text-xl font-extrabold">{ prompt ? 'Edit' : 'New'} Prompt</h2>
            <button onClick={onClose} className='opacity-70 transition-opacity inline-flex hover:opacity-100 hover:bg-red-100 hover:text-red-500 w-10 h-10 text-xl rounded-xl flex justify-center items-center'><IconX size={18} /></button>
          </div>
          <div className="text-sm font-bold text-black mt-4">
            {t('Name')}
          </div>
          <input
            className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900"
            placeholder={t('A name for your prompt.') || ''}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required={true}
          />
          <div className="mt-4 text-sm font-bold text-black ">
            {t('Description')}
          </div>
          <textarea
            className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 "
            style={{ resize: 'none' }}
            placeholder={t('A description for your prompt.') || ''}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />

          <div className="mt-4 text-sm font-bold text-black ">
            {t('Prompt')}
          </div>
          <textarea
            className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 "
            style={{ resize: 'none' }}
            placeholder={
              t(
                'Prompt content. Use {{}} to denote a variable. Ex: {{name}} is a {{adjective}} {{noun}}',
              ) || ''
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
          />
          <button
            type="submit"
            className="w-full px-4 py-2 my-4 border rounded-lg border-neutral-500 text-neutral-900 hover:bg-neutral-100 "
          >
            {t('Save')}
          </button>
        </form>
      </div>
    </Modal>
  );
};
