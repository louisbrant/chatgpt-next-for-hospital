import {
  IconCheck,
  IconMessage,
  IconPencil,
  IconStar,
  IconStarFilled,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import {
  DragEvent,
  KeyboardEvent,
  MouseEventHandler,
  useContext,
  useEffect,
  useState,
} from 'react';

import { Conversation } from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import SidebarActionButton from '@/components/Buttons/SidebarActionButton';
import ChatbarContext from '@/components/Chatbar/Chatbar.context';

import Image from 'next/image';
import messageIcon from '../../../public/iconmessage.svg';

interface Props {
  conversation: Conversation;
}

interface IconProps {
  icon: string;
  favorite: boolean;
  handleToggle: Function;
}

const LeftIcon = (props: IconProps) => {
  const status = props.icon;
  const favorite = props.favorite;
  const toggle = props.handleToggle;

  const toggleFavorite = () => {};


  return (
    <div
      onClick={() => {
        toggle();
      }}
      className='p-3'
    >
      {favorite && <IconStarFilled style={{ color: '#f59f00' }} size={18} />}
      {!favorite && status == 'msg' && <Image
        src={messageIcon}
        width={18}
        alt="Messasge"
      />}
      {!favorite && status == 'star' && <IconStar size={18} />}
    </div>
  );
};

export const ConversationComponent = ({ conversation }: Props) => {
  const {
    state: { selectedConversation, messageIsStreaming },
    handleSelectConversation,
    handleUpdateConversation,
  } = useContext(HomeContext);

  const { handleDeleteConversation } = useContext(ChatbarContext);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [iconImage, setIconImage] = useState('msg');

  const handleToggleFavorite = (conversation: Conversation) => {
    if(conversation.favorite == true) setIconImage("msg");
    handleUpdateConversation(conversation, {
      key: 'favorite',
      value: !conversation.favorite,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      selectedConversation && handleRename(selectedConversation);
    }
  };

  const handleDragStart = (
    e: DragEvent<HTMLButtonElement>,
    conversation: Conversation,
  ) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData('conversation', JSON.stringify(conversation));
    }
  };

  const handleRename = (conversation: Conversation) => {
    if (renameValue.trim().length > 0) {
      handleUpdateConversation(conversation, {
        key: 'name',
        value: renameValue,
      });
      setRenameValue('');
      setIsRenaming(false);
    }
  };

  const handleConfirm: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    if (isDeleting && !isRenaming) {
      handleDeleteConversation(conversation);
    } else if (isRenaming) {
      handleRename(conversation);
    }
    setIsDeleting(false);
    setIsRenaming(false);
  };

  const handleCancel: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setIsDeleting(false);
    setIsRenaming(false);
  };

  const handleOpenRenameModal: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setIsRenaming(true);
    selectedConversation && setRenameValue(selectedConversation.name);
  };
  const handleOpenDeleteModal: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setIsDeleting(true);
  };

  useEffect(() => {
    if (isRenaming) {
      setIsDeleting(false);
    } else if (isDeleting) {
      setIsRenaming(false);
    }
  }, [isRenaming, isDeleting]);


  return (
    <div
      className="relative flex items-center"
      onMouseOver={() => {
        setIconImage('star');
      }}
      onMouseLeave={(e) => {
        setIconImage('msg');
      }}
    >
      {isRenaming && selectedConversation?.id === conversation.id ? (
        <div className="flex w-full items-center gap-3 rounded-lg bg-white p-3">

          <Image
            src={messageIcon}
            width={17}
            alt="Messasge"
          />
          <textarea
            className="mr-12 flex-1 overflow-hidden overflow-ellipsis min-h-[50px] border-neutral-400 border p-1 bg-transparent text-left text-[12.5px] leading-3 text-black outline-none"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
          />
        </div>
      ) : (
        <button
          className={`flex w-full cursor-pointer items-center rounded-lg text-sm text-black transition-colors duration-200 hover:bg-white ${
            messageIsStreaming ? 'disabled:cursor-not-allowed' : ''} `}
          style={selectedConversation?.id === conversation.id ? {backgroundColor: "#D4D4D8"} : {}}
          disabled={messageIsStreaming}
          draggable="true"
          onDragStart={(e) => handleDragStart(e, conversation)}
        >

          <LeftIcon favorite={conversation.favorite} icon={iconImage} handleToggle={() => {handleToggleFavorite(conversation)}}></LeftIcon>

          <div className='py-3 pr-3 flex-1' onClick={() => handleSelectConversation(conversation)}>
            <div
            className={`relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all text-left text-[12.5px] leading-3 ${
              selectedConversation?.id === conversation.id ? 'pr-12' : 'pr-1'
            }`}
          >
              {conversation.name}
            </div>
          </div>
          
            
        </button>
      )}

      {(isDeleting || isRenaming) &&
        selectedConversation?.id === conversation.id && (
          <div className="absolute top-2 right-1 z-10 flex text-gray-300">
            <SidebarActionButton handleClick={handleCancel}>
              <IconX size={18} className="hover:text-red-400" />
            </SidebarActionButton>
            <SidebarActionButton handleClick={handleConfirm}>
              <IconCheck size={18} className="hover:text-green-400" />
            </SidebarActionButton>
          </div>
        )}

      {selectedConversation?.id === conversation.id &&
        !isDeleting &&
        !isRenaming && (
          <div className="absolute right-1 z-10 flex text-gray-300">
            <SidebarActionButton
              handleClick={handleOpenRenameModal}
              hoverColor="green"
            >
              <IconPencil size={18} />
            </SidebarActionButton>
            <SidebarActionButton
              handleClick={handleOpenDeleteModal}
              hoverColor="red"
            >
              <IconTrash size={18} />
            </SidebarActionButton>
          </div>
        )}
    </div>
  );
};
