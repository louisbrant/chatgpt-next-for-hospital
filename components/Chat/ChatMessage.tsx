import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconRotateClockwise,
  IconTrash,
  IconUser,
} from '@tabler/icons-react';
import { SiOpenai } from '@icons-pack/react-simple-icons';
import { FC, memo, useContext, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { updateConversation } from '@/utils/app/conversation';

import { Message } from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import { CodeBlock } from '../Markdown/CodeBlock';
import { MemoizedReactMarkdown } from '../Markdown/MemoizedReactMarkdown';
import rehypeMathjax from 'rehype-mathjax';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { Text2Speech } from './Text2Speech';
import Modal from 'react-modal';

Modal.setAppElement('#__next');


export interface Props {
  message: Message;
  messageIndex: number;
  onEdit?: (editedMessage: Message) => void
}

export const ChatMessage: FC<Props> = memo(({ message, messageIndex, onEdit }) => {
  const { t } = useTranslation('chat');
  const MESSAGE_LENGTH_SIDEBAR_OPTIONS = 600;

  const {
    state: { selectedConversation, conversations, currentMessage, messageIsStreaming, userAvatar },
    handleUpdateUserAvatar,
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [messageContent, setMessageContent] = useState(message.content);
  const [messagedCopied, setMessageCopied] = useState(false);
  const [isModalImage, setIsModalImage] = useState<boolean>(false);
  const [image, setImage] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageContent(event.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleEditMessage = () => {
    if (message.content != messageContent) {
      if (selectedConversation && onEdit) {
        onEdit({ ...message, content: messageContent });
      }
    }
    setIsEditing(false);
  };

  const handleRetryMessage = () => {
    if(message.content && messageContent && onEdit) {
      onEdit({ ...message, content: messageContent });
    }
  };

  const handleDeleteMessage = () => {
    if (!selectedConversation) return;
    const { messages } = selectedConversation;
    if (
      messageIndex < messages.length - 1 &&
      messages[messageIndex + 1].role === 'assistant'
    ) {
      messages.splice(messageIndex, 2);
    } else {
      messages.splice(messageIndex, 1);
    }
    const updatedConversation = {
      ...selectedConversation,
      messages,
    };

    const { single, all } = updateConversation(
      updatedConversation,
      conversations,
    );
    homeDispatch({ field: 'selectedConversation', value: single });
    homeDispatch({ field: 'conversations', value: all });
  };

  const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !isTyping && !e.shiftKey) {
      e.preventDefault();
      handleEditMessage();
    }
  };

  const 
  copyOnClick = () => {
    if (!navigator.clipboard) return;

    navigator.clipboard.writeText(message.content).then(() => {
      setMessageCopied(true);
      setTimeout(() => {
        setMessageCopied(false);
      }, 2000);
    });
  };

  const handleChangeImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImage(event.target.value);
  }

  const handleSaveImage = () => {
    setIsModalImage(false);
    handleUpdateUserAvatar(image);
  }

  const openModal = () => {
    setIsModalImage(true);
    setImage(userAvatar);
  }


  useEffect(() => {
    setMessageContent(message.content);
  }, [message.content]);


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  return (
    <div
      className={`group mx-auto ${
        message.role === 'assistant'
          ? 'rounded-2xl p-3'
          : 'rounded-2xl p-3'
      }`}
      style={{
        overflowWrap: 'anywhere',
        display: 'flex',
        justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
        maxWidth: '710px',
      }}
    >  
      <div className="relative flex items-start prose ">
      {message.role === 'assistant' && (
        <div className={`h-10 w-10 rounded-xl inline-flex items-center justify-center mr-2 bg-teal-500 text-white flex-shrink-0`}>
          <SiOpenai size={30} />
        </div>
      )}
      <div className={`prose flex-grow max-w-full `}>
      {message.role === 'user' ? (
          <div className="flex flex-col items-end">
            {isEditing ? (
              <div className="prose flex w-full flex-col max-w-full">
                <textarea
                  ref={textareaRef}
                  className="bg-blue-500 rounded-2xl text-white px-4 py-2"
                  value={messageContent}
                  onChange={handleInputChange}
                  onKeyDown={handlePressEnter}
                  onCompositionStart={() => setIsTyping(true)}
                  onCompositionEnd={() => setIsTyping(false)}
                  style={{
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                    padding: '10px 12px 10px 12px',
                    margin: '0',
                    overflowY: "auto",
                    overflowX: "hidden",
                    height: 'auto',
                    minHeight: '56px',
                    maxHeight: '150px',
                    minWidth: bubbleRef.current ? bubbleRef.current.clientWidth + 'px' : '100%',
                    width: '100%',
                    resize: 'vertical',
                    cursor: 'auto',
                  }}
                />
                  <div className="mt-2 flex justify-center space-x-3">
                    <button
                      className="text-gray-500 hover:text-gray-800 ml-1"
                      onClick={handleEditMessage}
                      disabled={messageContent.trim().length <= 0}
                    >
                      {t('Save & Submit')}
                    </button>
                    <button
                      className="h-[40px] rounded-md border border-neutral-300 px-4 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                      onClick={() => {
                        setMessageContent(message.content);
                        setIsEditing(false);
                      }}
                    >
                      {t('Cancel')}
                    </button>
                  </div>
                </div>
              ) : (
              <>
              <div className='flex'>
              <button className={`h-10 w-10 rounded-xl inline-flex items-center justify-center mr-2 bg-gray-300 text-white flex-shrink-0`} data-modal-target="defaultModal" data-modal-toggle="defaultModal" onClick={openModal}>
                {
                  userAvatar ? 
                  <img className="h-full" src={userAvatar} alt="chat avatar" />
                  :
                  <IconUser size={30} />
                }  
              </button>
              
              <Modal
                isOpen={isModalImage}
                onRequestClose={() => setIsModalImage(false)}
                className="bg-transparent"
              >
                <div className='inline-block w-full align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:align-middle p-4 sm:p-6 overflow-hidden sm:w-[400px]'>
                  <div className="rounded-lg mt-2 text-gray-800 text-left text-sm">
                    <h2 className="text-center text-xl font-bold">Enter Your Profile Picture URL</h2>
                    <form className="mt-4">
                      <input type="text" name="picture" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Enter your profile picture URL here" onChange={handleChangeImage} value={image} />
                      <button className="mx-auto mt-4 flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 space-x-1 disabled:bg-gray-500" onClick={handleSaveImage}>
                        <span>OK</span>
                      </button>
                    </form>
                  </div>
                </div>
              </Modal>

                <div
                ref={bubbleRef} 
                className="prose whitespace-pre-wrap flex-1 text-white bg-blue-500 rounded-2xl px-4 py-1.5 w-fit justify-end">
                  {message.content}
                </div>
              </div>
                
                <div className="mt-1">
                  <div className="md:ml-0 md:flex-row gap-4 md:gap-1 items-center md:items-start justify-start md:justify-start mt-auto">
                  <button
                      className="invisible group-hover:visible focus:visible text-gray-500 hover:text-gray-700 rounded-lg px-2 text-sm h-6 inline-flex items-center justify-center border shrink-0 text-center disabled:pointer-events-none border-zinc-300 bg-white border-b-zinc-400/80 active:bg-zinc-200 mr-1"
                      onClick={handleRetryMessage}
                    >
                      <IconRotateClockwise size={20} className='icon-rotate' />
                    </button>

                    <button
                      className="invisible group-hover:visible focus:visible text-gray-500 hover:text-gray-700 rounded-lg px-2 text-sm h-6 inline-flex items-center justify-center border shrink-0 text-center disabled:pointer-events-none border-zinc-300 bg-white border-b-zinc-400/80 active:bg-zinc-200 mr-1"
                      onClick={copyOnClick}
                    >
                      {messagedCopied ? (
                    <IconCheck
                      size={20}
                      className="text-green-500"
                        />
                      ) : (
                          <IconCopy size={20} />
                      )}
                    </button>
                    <button
                      className="invisible group-hover:visible focus:visible text-gray-500 hover:text-gray-700 rounded-lg px-2 text-sm h-6 inline-flex items-center justify-center border shrink-0 text-center disabled:pointer-events-none border-zinc-300 bg-white border-b-zinc-400/80 active:bg-zinc-200 mr-1"
                      onClick={toggleEditing}
                    >
                      <IconEdit size={20} />
                    </button>
                    <button
                      className="invisible group-hover:visible focus:visible text-red-500 hover:text-red-700  rounded-lg px-2 text-sm h-6 inline-flex items-center justify-center border shrink-0 text-center disabled:pointer-events-none border-zinc-300 bg-white border-b-zinc-400/80 active:bg-zinc-200 mr-1"
                      onClick={handleDeleteMessage}
                    >
                      <IconTrash size={20} />
                    </button>
                  </div>
                </div>
              </>
              )}
          </div>
          ) : (
            <div className="flex flex-row items-start">
              <div>
                <div className="bg-zinc-100 rounded-2xl px-4 py-1.5 w-full md:w-auto">
                <MemoizedReactMarkdown
                  className="prose flex-1"
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeMathjax]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');

                      return !inline ? (
                        <CodeBlock
                          key={Math.random()}
                          language={(match && match[1]) || ''}
                          value={String(children).replace(/\n$/, '')}
                          {...props}
                        />
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    table({ children }) {
                      return (
                        <table className="border-collapse border border-black px-3 py-1 ">
                          {children}
                        </table>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="break-words border border-black bg-white px-3 py-1 text-white ">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="break-words border border-black px-3 py-1 ">
                          {children}
                        </td>
                      );
                    },
                  }}
                >
                  {`${message.content}${
                      messageIsStreaming && messageIndex == (selectedConversation?.messages.length ?? 0) - 1 ? '▍' : ''
                  }`}
                </MemoizedReactMarkdown>
                <Text2Speech content={message.content} />
                </div>
                
                <div className="mt-1">
                  <div className="md:ml-0 md:flex-row gap-4 md:gap-1 items-center md:items-start justify-start md:justify-start mt-auto">
                    <button
                      className="invisible group-hover:visible focus:visible text-gray-500 hover:text-gray-700 rounded-lg px-2 text-sm h-6 inline-flex items-center justify-center border shrink-0 text-center disabled:pointer-events-none border-zinc-300 bg-white border-b-zinc-400/80 active:bg-zinc-200 mr-1"
                      onClick={handleRetryMessage}
                    >
                      <IconRotateClockwise size={20} className='icon-rotate' />
                    </button>

                    <button
                      className="invisible group-hover:visible focus:visible text-gray-500 hover:text-gray-700 rounded-lg px-2 text-sm h-6 inline-flex items-center justify-center border shrink-0 text-center disabled:pointer-events-none border-zinc-300 bg-white border-b-zinc-400/80 active:bg-zinc-200 mr-1"
                      onClick={copyOnClick}
                    >
                      {messagedCopied ? (
                    <IconCheck
                      size={20}
                      className="text-green-500"
                        />
                      ) : (
                          <IconCopy size={20} />
                      )}
                    </button>
                    <button
                      className="invisible group-hover:visible focus:visible text-red-500 hover:text-red-700  rounded-lg px-2 text-sm h-6 inline-flex items-center justify-center border shrink-0 text-center disabled:pointer-events-none border-zinc-300 bg-white border-b-zinc-400/80 active:bg-zinc-200  mr-1"
                      onClick={handleDeleteMessage}
                    >
                      <IconTrash size={20} />
                    </button>
                  </div>
              </div>

              </div>
              {message.content.length > MESSAGE_LENGTH_SIDEBAR_OPTIONS && 
                <div className="md:-mr-8 ml-1 md:ml-0 flex flex-col md:flex-col gap-4 md:gap-1 items-center md:items-start justify-end md:justify-start invisible group-hover:visible w-8">
                <button
                    className="text-gray-500 hover:text-gray-700 rounded-lg px-2 text-sm h-6 inline-flex items-center justify-center border shrink-0 text-center disabled:pointer-events-none border-zinc-300 bg-white border-b-zinc-400/80 active:bg-zinc-200 ml-1"
                    onClick={handleRetryMessage}
                  >
                    <IconRotateClockwise size={20} className='icon-rotate' />
                  </button>
                  {messagedCopied ? (
                    <IconCheck
                      size={20}
                      className="text-green-500 "
                    />
                  ) : (
                    <button
                    className="text-gray-500 hover:text-gray-700 rounded-lg px-2 text-sm h-6 inline-flex items-center justify-center border shrink-0 text-center disabled:pointer-events-none border-zinc-300 bg-white border-b-zinc-400/80 active:bg-zinc-200 ml-1"
                    onClick={copyOnClick}
                  >
                    <IconCopy size={20} />
                  </button>
                )}
                <button
                    className="text-red-500 hover:text-red-700  rounded-lg px-2 text-sm h-6 inline-flex items-center justify-center border shrink-0 text-center disabled:pointer-events-none border-zinc-300 bg-white border-b-zinc-400/80 active:bg-zinc-200 ml-1"
                    onClick={handleDeleteMessage}
                  >
                    <IconTrash size={20} />
                  </button>
              </div>
              }
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
ChatMessage.displayName = 'ChatMessage';
