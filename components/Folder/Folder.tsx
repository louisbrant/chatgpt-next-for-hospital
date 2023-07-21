import {
  IconCaretDown,
  IconCaretRight,
  IconCheck,
  IconPalette,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconX,
  IconFolder,
} from '@tabler/icons-react';
import {
  KeyboardEvent,
  ReactElement,
  useContext,
  useEffect,
  useState,
} from 'react';

import { FolderInterface, FolderType } from '@/types/folder';

import HomeContext from '@/pages/api/home/home.context';

import SidebarActionButton from '@/components/Buttons/SidebarActionButton';

import { useTranslation } from 'next-i18next';

interface Props {
  currentFolder: FolderInterface;
  searchTerm: string;
  handleDrop: (e: any, folder: FolderInterface) => void;
  folderComponent: (ReactElement | undefined)[];
}

const Folder = ({
  currentFolder,
  searchTerm,
  handleDrop,
  folderComponent,
}: Props) => {
  const { t } = useTranslation('sidebar');

  const { handleDeleteFolder, handleUpdateFolder, handleNewConversation } = useContext(HomeContext);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenColor, setIsOpenColor] = useState(false);
  const [adClass, setAdClass] = useState<String>(
    currentFolder.color ? currentFolder.color : '',
  );
  const [adClass2, setAdClass2] = useState<String>(
    currentFolder.hoverColor ? currentFolder.hoverColor : '',
  );

  const [hightLight, setHightLight] = useState<boolean>(false);

  useEffect(() => {
    if (isRenaming) {
      setIsDeleting(false);
    } else if (isDeleting) {
      setIsRenaming(false);
    }
  }, [isRenaming, isDeleting]);

  useEffect(() => {
    if (searchTerm) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [searchTerm]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRename(renameValue);
    }
  };

  const handleRename = (newValue: string) => {
    handleUpdateFolder(currentFolder.id, newValue);
    setRenameValue('');
    setIsRenaming(false);
  };

  const dropHandler = (e: any) => {
    if (e.dataTransfer) {
      setIsOpen(true);
      setHightLight(false);
      handleDrop(e, currentFolder);
      currentFolder.chatsNumber ? currentFolder.chatsNumber++ : (currentFolder.chatsNumber = 1);

      let newValue;

      if (currentFolder.chatsNumber === 1) {
        newValue = currentFolder.name + ` (${currentFolder.chatsNumber} chat)`;
      } else {
        newValue =
          currentFolder.name.slice(0, 13) +
          `(${currentFolder.chatsNumber} chats)`;
      }

      handleRename(newValue);
    }
  };

  const allowDrop = (e: any) => {
    if(!hightLight)
      setHightLight(true);
    e.preventDefault();
  };

  const highlightDrop = (e: any) => {
  };
  
  const removeHighlight = (e: any) => {
    setHightLight(false);
  };

  const colorHandler = (adClassname: string, adClassname2: string) => {
    setAdClass(adClassname);
    setAdClass2(adClassname2);
    setIsOpenColor(false);
    let folders = localStorage.getItem('folders')
      ? JSON.parse(localStorage.getItem('folders')!)
      : [];
    folders = folders.map((item: FolderInterface) => {
      if (item.id == currentFolder.id) {
        let tmp = { ...item };
        tmp['color'] = adClassname;
        tmp['hoverColor'] = adClassname2;
        return tmp;
      } else {
        return item;
      }
    });
    localStorage.setItem('folders', JSON.stringify(folders));
  };

  return (
      <div className="relative flex my-1 flex-col">
        {isRenaming ? (
          <div className="flex w-full items-center gap-3 p-3 text-black">
            {isOpen ? (
              <IconCaretDown size={18} />
            ) : (
              <IconFolder size={18} />
            )}
            <textarea
              className="mr-12 flex-1 overflow-hidden min-h-[50px] overflow-ellipsis border border-neutral-400 p-1 bg-transparent text-left text-[12.5px] leading-3 text-black outline-none"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
          </div>
        ) : (
          <div className='group w-full flex flex-col'>
            <button
              className={`${!adClass && 'bg-[#F4F4F5]'} ${hightLight && 'folder-highlight'} z-10 flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-sm text-black transition-colors duration-300 ${adClass} ${adClass2}`}
              onClick={() => setIsOpen(!isOpen)}
              onDrop={(e) => dropHandler(e)}
              onDragOver={allowDrop}
              onDragEnter={highlightDrop}
              onDragLeave={removeHighlight}
            >
              {isOpen ? (
                <IconCaretDown
                  size={18}
                  className={
                    adClass && adClass != ''
                      ? ' transition-colors duration-300 text-white'
                      : ''
                  }
                />
              ) : (
                <IconFolder
                  size={18}
                  className={
                    adClass && adClass != ''
                      ? ' transition-colors duration-300 text-white'
                      : ''
                  }
                />
              )}

              <div
                className={
                  'relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-300 break-all text-left text-[12.5px] leading-3' +
                  (adClass && adClass != ''
                    ? ' text-white group-hover:text-white'
                    : '')
                }
              >
                {currentFolder.name}
              </div>
            </button>
            {isOpen && currentFolder.type == 'chat' &&  
                <div className='text-black text-left ml-5 mt-1 gap-2 border-l pl-2 top-0 -translate-y-9 group-hover:translate-y-0 duration-300 transition-all -mb-11 group-hover:mb-1'>
                  <button className='flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-black transition-colors duration-200 transition-all hover:bg-white' onClick={() => handleNewConversation(currentFolder.id)}><IconPlus size={18}/>New chat</button>
                </div>         
            } 
          </div>
        )}

        {(isDeleting || isRenaming) && (
          <div className="absolute top-2 right-1 z-10 flex text-gray-300">
            <SidebarActionButton
              handleClick={(e) => {
                e.stopPropagation();
                setIsDeleting(false);
                setIsRenaming(false);
              }}
            >
              <IconX size={18} className="hover:text-red-400" />
            </SidebarActionButton>
            <SidebarActionButton
              handleClick={(e) => {
                e.stopPropagation();

                if (isDeleting) {
                  handleDeleteFolder(currentFolder.id);
                } else if (isRenaming) {
                  handleRename(renameValue);
                }

                setIsDeleting(false);
                setIsRenaming(false);
              }}
            >
              <IconCheck size={18} className="hover:text-green-400" />
            </SidebarActionButton>
          </div>
        )}

        {!isDeleting && !isRenaming && (
          <>
            <div className="absolute mt-2.5 right-1 z-10 flex text-gray-300">
              <SidebarActionButton
                handleClick={(e) => {
                  e.stopPropagation();
                  if (!isOpenColor) {
                    setIsOpenColor(true);
                  } else {
                    setIsOpenColor(false);
                  }
                }}
              >
                <IconPalette
                  size={18}
                  className="text-gray-300 transition-colors duration-300 hover:text-pink-800"
                />
              </SidebarActionButton>
              <SidebarActionButton
                handleClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                  setRenameValue(currentFolder.name);
                }}
              >
                <IconPencil
                  size={18}
                  className="text-gray-300 hover:text-green-400"
                />
              </SidebarActionButton>
              <SidebarActionButton
                handleClick={(e) => {
                  e.stopPropagation();
                  setIsDeleting(true);
                }}
              >
                <IconTrash
                  size={18}
                  className="text-gray-300 hover:text-red-400"
                />
              </SidebarActionButton>
            </div>
            {isOpenColor && (
              <div className="absolute top-10 right-6 p-2 border border-grey-400 border-solid z-50 rounded bg-white">
                <div
                  onClick={() =>  colorHandler('!bg-red-600', 'hover:!bg-red-800')}
                  className="w-4 h-4 bg-red-600 rounded-full transition-scale duration-300 hover:scale-125 mb-2"
                ></div>
                <div
                  onClick={() => colorHandler('!bg-purple-600', 'hover:!bg-purple-800')}
                  className="w-4 h-4 bg-purple-600 rounded-full transition-scale duration-300 hover:scale-125 mb-2"
                ></div>
                <div
                  onClick={() => colorHandler('!bg-blue-600', 'hover:!bg-blue-800')}
                  className="w-4 h-4 bg-blue-600 rounded-full transition-scale duration-300 hover:scale-125 mb-2"
                ></div>
                <div
                  onClick={() => colorHandler('!bg-green-600', 'hover:!bg-green-800')}
                  className="w-4 h-4 bg-green-600 rounded-full transition-scale duration-300 hover:scale-125 mb-2"
                ></div>
                <div
                  onClick={() => colorHandler('!bg-yellow-600', 'hover:!bg-yellow-800')}
                  className="w-4 h-4 bg-yellow-700 rounded-full transition-scale duration-300 hover:scale-125 mb-2"
                ></div>
                <IconRefresh
                  onClick={() => colorHandler('', '')}
                  size={18}
                  className="text-gray-800 transition-colors duration-300 hover:text-teal-600"
                />
              </div>
            )}
          </>
        )}
        {isOpen &&  
          <>
            {folderComponent}
          </>
        } 
      </div>   
  );
};

export default Folder;
