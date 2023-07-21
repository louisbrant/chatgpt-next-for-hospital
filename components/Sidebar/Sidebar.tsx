import {
  IconDots,
  IconFolderPlus,
  IconMistOff,
  IconPlus,
  IconX,
  IconMenu2,
  IconStarFilled,
  IconFolder
} from '@tabler/icons-react';
import { ReactNode, useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatbarSettings } from '../Chatbar/components/ChatbarSettings';
import {
  OpenSidebarButton,
} from './components/OpenCloseButton';

import Search from '../Search';

import Image from 'next/image';
import logoImage from '../../public/logo.svg';
import { black } from 'kleur/colors';

interface Props<T> {
  isOpen: boolean;
  addItemButtonTitle: string;
  side: 'left' | 'right';
  items: T[];
  favoriteComponent: ReactNode;
  itemComponent: ReactNode;
  folderComponent: ReactNode;
  footerComponent?: ReactNode;
  searchTerm: string;
  handleSearchTerm: (searchTerm: string) => void;
  toggleOpen: () => void;
  handleCreateItem: () => void;
  handleCreateFolder: () => void;
  handleDrop: (e: any) => void;
}

const Sidebar = <T,>({
  isOpen,
  addItemButtonTitle,
  side,
  items,
  favoriteComponent,
  itemComponent,
  folderComponent,
  footerComponent,
  searchTerm,
  handleSearchTerm,
  toggleOpen,
  handleCreateItem,
  handleCreateFolder,
  handleDrop,
}: Props<T>) => {
  const { t } = useTranslation('promptbar');

  const allowDrop = (e: any) => {
    e.preventDefault();
  };

  const highlightDrop = (e: any) => {
  };

  const removeHighlight = (e: any) => {
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  const [showFavorite, setShowFavorite] = useState(true);
  const [showFolder, setShowFolder] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflowY = 'hidden';
      document.body.classList.add('sidebar-active');
    } else {
      document.body.style.overflowY = 'auto';
      document.body.classList.remove('sidebar-active');
    }
  }, [isOpen]);

  const [size, setSize] = useState([0, 0]);

  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (<>
    <div
      className={`fixed top-0 ${side}-0 z-50 flex h-screen w-[310px] flex-none flex-col space-y-2 bg-[#F4F4F5] p-2 text-[14px] transition-all lg:relative sm:top-0 max-sm:w-[350px] sidebar sidebar-${side} ${isOpen ? "sidebar--Shown" : "sidebar--Hidden"}`}
    >
      <div className='flex justify-between mt-2 mb-1 ml-1'>
        <div className="logo">
          <Image
            src={logoImage}
            alt="Logo"/>
        </div>
        <button onClick={toggleOpen} className={`btn-close-sidebar btn-close-sidebar-${side} ${!isOpen && 'hidden'}`} style={side === 'left' ? {transform:"translate(-55px, 0px)"} : {}}>{side === 'left' ? <IconMenu2 color={"black"} /> : <IconX />}</button>
      </div>
      <Search
        placeholder={t('Search...') || ''}
        searchTerm={searchTerm}
        onSearch={handleSearchTerm}
      />
      <div className="flex items-center">
        { side === 'left' && <IconStarFilled style={{ color: '#000000', marginLeft: "5px", cursor: "pointer" }} onClick={()=>{setShowFavorite(!showFavorite)}} size={18}/>}
        
        <button
          className="text-sidebar flex flex-shrink-0 cursor-pointer select-none items-center gap-1 rounded-md border border-black p-1 text-black transition-colors duration-200 hover:bg-gray-500/10 pr-3 ml-auto"
          style={{fontSize:"13px"}}
          onClick={() => {
            handleCreateItem();
            handleSearchTerm('');
          }}
        >
          <IconPlus size={16} />
          {addItemButtonTitle}
        </button>
      </div>
      <div className="flex flex-col flex-grow overflow-auto ">
        {side === 'left' && showFavorite && favoriteComponent}
        <div className="flex mt-2 mb-1 ml-1">
          <IconFolder color={"black"} size={19} onClick={()=>{setShowFolder(!showFolder)}} style={{marginRight:"5px", cursor:"pointer"}}/>
          <IconPlus color={"black"} size={19} onClick={handleCreateFolder} style={{cursor:"pointer"}}/>
        </div>
        {/* {showFolder && items?.length > 0 && ( */}
        {showFolder && (
          <div className="flex border-b border-black pb-2">
            {folderComponent}
          </div>
        )}

        {items?.length > 0 ? (
          <div
            className="flex-grow pt-2"
            onDrop={handleDrop}
            onDragOver={allowDrop}
            onDragEnter={highlightDrop}
            onDragLeave={removeHighlight}
          >
            {itemComponent}
          </div>
        ) : 
          side === 'left' && ( 
            <div className="mt-8 py-6 px-4 select-none text-center text-black opacity-50 border border-dashed border-gray-800 rounded-md">
              <h5 className="text-[17px] mb-4">No Chats Yet</h5>
              <p>Click the button above to start a new chat</p>
            </div>
          )
        }
      </div>
      {footerComponent}
    </div>
    <OpenSidebarButton onClick={toggleOpen} side={side} />
  </>);
};

export default Sidebar;
