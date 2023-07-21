import {
  IconArrowDown,
  IconBolt,
  IconBrandGoogle,
  IconPlayerStop,
  IconSend,
  IconPlus,
  IconShare,
  IconDots,
  IconRefresh,
  IconMicrophone,
  IconX,
  IconCheck,
  IconSettings,
  IconTrash,
  IconSearch,
  IconArrowRight,
} from '@tabler/icons-react';
import {
  KeyboardEvent,
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  forwardRef,
} from 'react';


import { useTranslation } from 'next-i18next';
import { motion, AnimatePresence } from 'framer-motion';

import { Message } from '@/types/chat';
import { Plugin } from '@/types/plugin';
import { Prompt } from '@/types/prompt';
import { Box, Button, Spinner, Text } from "@chakra-ui/react";

import HomeContext from '@/pages/api/home/home.context';

import { PluginSelect } from './PluginSelect';
import { PromptList } from './PromptList';
import { VariableModal } from './VariableModal';
import { OPENAI_API_KEY } from '@/utils/app/const';
import { useWhisper } from '@chengsokdara/use-whisper';
import { newPromptItem } from '@/utils/app/prompts';
import { PromptModal } from '../Promptbar/components/PromptModal';
import ClickAwayListener from 'react-click-away-listener';
import TextareaAutosize, { type TextareaAutosizeProps } from 'react-textarea-autosize';
import { IconWand, IconUserCircle, IconBook, IconHistory } from '@tabler/icons-react';
const MotionButton = motion(Button);
const TextAreaAutosize = forwardRef<HTMLTextAreaElement, TextareaAutosizeProps>((props, ref) => (
  <TextareaAutosize ref={ref} {...props} />
))

TextAreaAutosize.displayName = "TextareaAutosizeMotion"

const TextAreaAutosizeMotion = motion(TextAreaAutosize)
interface Props {
  onSend: (message: Message, plugin: Plugin | null) => void;
  onRegenerate: () => void;
  onScrollDownClick: () => void;
  stopConversationRef: MutableRefObject<boolean>;
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>;
  showScrollDownButton: boolean;
  onNewConversation?: () => void;
  handleSettings: () => void;
  onClearAll: () => void;
  showSettings: boolean
}

const useTimer = (initialState = 0) => {
  const [timer, setTimer] = useState(initialState)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const countRef = useRef(0)

  const handleStartTimer = () => {
    setIsActive(true)
    setIsPaused(true)
    countRef.current = window.setInterval(() => {
      setTimer((timer) => timer + 1)
    }, 1000)
  }

  const handlePauseTimer = () => {
    clearInterval(countRef.current)
    setIsPaused(false)
  }

  const handleResumeTimer = () => {
    setIsPaused(true)
    countRef.current = window.setInterval(() => {
      setTimer((timer) => timer + 1)
    }, 1000)
  }

  const handleResetTimer = () => {
    clearInterval(countRef.current)
    setIsActive(false)
    setIsPaused(false)
    setTimer(0)
  }

  return { timer, isActive, isPaused, handleStartTimer, handlePauseTimer, handleResumeTimer, handleResetTimer }
}

export const ChatInput = ({
  onSend,
  onRegenerate,
  onScrollDownClick,
  stopConversationRef,
  textareaRef,
  showScrollDownButton,
  onNewConversation,
  handleSettings,
  onClearAll,
  showSettings
}: Props) => {
  const { t } = useTranslation('chat');

  const {
    transcript,
    startRecording,
    stopRecording,
  } = useWhisper({
    apiKey: OPENAI_API_KEY
  })

  const {
    state: { selectedConversation, messageIsStreaming, prompts, defaultModelId },

    dispatch: homeDispatch
  } = useContext(HomeContext);



  const [content, setContent] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showPromptList, setShowPromptList] = useState(false);
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showPluginSelect, setShowPluginSelect] = useState(false);
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [isRecorded, setIsRecorded] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const promptListRef = useRef<HTMLUListElement | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [settingPopup, setSettingPopup] = useState<boolean>(false);

  const { timer, isActive, isPaused, handleStartTimer, handlePauseTimer, handleResumeTimer, handleResetTimer } = useTimer(0);

  const addNewPromptOption = (prompts: Prompt[]) => {
    const filteredPromptsTemp = prompts.filter((prompt) =>
      prompt.name.toLowerCase().includes(promptInputValue.toLowerCase())
    );
    filteredPromptsTemp.push(newPromptItem());
    return filteredPromptsTemp;
  }

  const filteredPrompts = addNewPromptOption(prompts);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const maxLength = selectedConversation?.model.maxLength;

    if (maxLength && value.length > maxLength) {
      alert(
        t(
          `Message limit is {{maxLength}} characters. You have entered {{valueLength}} characters.`,
          { maxLength, valueLength: value.length },
        ),
      );
      return;
    }

    setContent(value);
    updatePromptListVisibility(value);
  };

  const sendMsg = useCallback((content: string) => {
    if (messageIsStreaming) {
      return;
    }

    onSend({ role: 'user', content }, plugin);
    setContent('');
    setPlugin(null);

    if (window.innerWidth < 640 && textareaRef && textareaRef.current) {
      textareaRef.current.blur();
    }
  }, [messageIsStreaming, textareaRef, onSend, plugin])

  const handleSend = () => {
    if (!content) {
      alert(t('Please enter a message'));
      return;
    }
    sendMsg(content);
  };

  const handleSendAudio = useCallback((content: string) => {
    if (!content) {
      return;
    }
    sendMsg(content);
  }, [sendMsg]);

  const handleStopConversation = () => {
    stopConversationRef.current = true;
    setTimeout(() => {
      stopConversationRef.current = false;
    }, 1000);
  };

  const isMobile = () => {
    const userAgent =
      typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    return mobileRegex.test(userAgent);
  };

  const handleInitModal = () => {
    const selectedPrompt: Prompt = filteredPrompts[activePromptIndex];
    if (selectedPrompt) {
      if (activePromptIndex === filteredPrompts.length - 1) {
        setShowModal(true);
      }
      else {
        setContent((prevContent) => {
          const newContent = prevContent?.replace(
            /\/\w*$/,
            selectedPrompt.content,
          );
          return newContent;
        });
        handlePromptSelect(selectedPrompt);
        setShowPromptList(false);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPromptList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : prevIndex,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex,
        );
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : 0,
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleInitModal();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowPromptList(false);
      } else {
        setActivePromptIndex(0);
      }
    } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === '/' && e.metaKey) {
      e.preventDefault();
      setShowPluginSelect(!showPluginSelect);
    }
  };

  const parseVariables = (content: string) => {
    const regex = /{{(.*?)}}/g;
    const foundVariables = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      foundVariables.push(match[1]);
    }

    return foundVariables;
  };

  const updatePromptListVisibility = useCallback((text: string) => {
    const match = text.match(/\/\w*$/);

    if (match) {
      setShowPromptList(true);
      setPromptInputValue(match[0].slice(1));
    } else {
      setShowPromptList(false);
      setPromptInputValue('');
    }
  }, []);

  const handlePromptSelect = (prompt: Prompt) => {
    const parsedVariables = parseVariables(prompt.content);
    setVariables(parsedVariables);

    if (parsedVariables.length > 0) {
      setIsModalVisible(true);
    } else {
      setContent((prevContent) => {
        const updatedContent = prevContent?.replace(/\/\w*$/, prompt.content);
        return updatedContent;
      });
      updatePromptListVisibility(prompt.content);
    }
  };

  const handleSubmit = (updatedVariables: string[]) => {
    const newContent = content?.replace(/{{(.*?)}}/g, (match, variable) => {
      const index = variables.indexOf(variable);
      return updatedVariables[index];
    });

    setContent(newContent);

    if (textareaRef && textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleShare = () => {
    console.log('br_share');
  }

  const handleStartRecording = () => {
    startRecording();
    handleStartTimer();
    setIsRecording(true);
  }

  const handleSaveRecording = () => {
    stopRecording();
    setIsRecording(false);
    setIsRecorded(true);
    handleResetTimer();
  }

  const handleStopRecording = () => {
    stopRecording();
    setIsRecording(false);
    setIsRecorded(false);
    handleResetTimer();
  }

  const handleCreatePrompt = () => {
  }

  useEffect(() => {
    if (isRecorded == true) {
      if (transcript.text)
        handleSendAudio(transcript.text);
      else
        alert('No audio recorded');
      setIsRecorded(false);
    }
  }, [transcript.text, handleSendAudio, isRecorded]);

  useEffect(() => {
    if (promptListRef.current) {
      promptListRef.current.scrollTop = activePromptIndex * 30;
    }
  }, [activePromptIndex]);
  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`;
      textareaRef.current.style.overflow = `${textareaRef?.current?.scrollHeight > 400 ? 'auto' : 'hidden'
        }`;
    }
  }, [content, textareaRef]);


  const formatTime = (timer: number) => {
    const getSeconds: any = `0${(timer % 60)}`.slice(-2)
    const minutes: any = `${Math.floor(timer / 60)}`
    const getMinutes = `${minutes % 60}`.slice(-2)
    return `${getMinutes}:${getSeconds}`
  }

  const handleScrollDownClick = () => {
    if (showScrollDownButton && window.innerWidth <= 640)
      onScrollDownClick();
  }

  const handleShowSettings = () => {
    handleSettings();
    setSettingPopup(false);
  }

  const handleClearAll = () => {
    onClearAll();
    setSettingPopup(false);
  }

  const buttonVariants = {
    initial: { scale: 1, boxShadow: 'none', y: 0 },
    hover: { scale: 1.05, boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)', y: -2 },
    tap: { scale: 0.95 },
  };

  return (
    <div className="bottom-0 left-0 w-full border-transparent bg-gradient-to-b from-transparent via-white to-white pt-6 md:pt-2 shrink-0  px-3 py-3 mt-auto z-10 chat-input">
      <div className='rounded-lg border-zinc-300 mx-2 mt-4 flex flex-col last:mb-2 md:mx-4 md:mt-[35px] md:last:mb-6 lg:mx-auto lg:max-w-3xl items-center'>
        {selectedConversation &&
          selectedConversation.messages.length > 0 && (
            <div className="flex space-x-2 mt-1 justify-center under-search-container" style={{
              background: "black",
              width: "94%",
              borderTopLeftRadius: "2rem",
              borderTopRightRadius: "2rem",
              paddingTop: "0.8rem",
              paddingBottom: " 0.8rem"
            }}>
              <motion.div>
                <MotionButton
                  position="relative"
                  top={0}
                  right={0}
                  zIndex={10}
                  background="none"
                  color="#54c7e3"
                  borderRadius="8px"
                  paddingY="2px"
                  paddingX="5px"
                  fontSize="16px"
                  fontWeight="bold"
                  fontFamily="'Roboto', sans-serif"
                  textAlign="center"
                  _hover={{
                    fontsize: "20px",
                    color: "white",
                  }}
                  variants={buttonVariants}
                  initial="initial"
                  animate="initial"
                  whileHover="hover"
                  whileTap="tap"
                  transition={{ type: 'spring', stiffness: 300, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                  title={'Suggestd Search'}
                >
                  <IconWand xlinkTitle='Suggestd Search' size={32} />
                </MotionButton>
              </motion.div>

              <motion.div>
                <MotionButton
                  position="relative"
                  top={0}
                  right={0}
                  zIndex={10}
                  background="none"
                  color="#54c7e3"
                  borderRadius="8px"
                  paddingY="2px"
                  paddingX="5px"
                  fontSize="16px"
                  fontWeight="bold"
                  fontFamily="'Roboto', sans-serif"
                  textAlign="center"
                  _hover={{
                    fontsize: "20px",
                    color: "white",
                  }}
                  variants={buttonVariants}
                  initial="initial"
                  animate="initial"
                  whileHover="hover"
                  whileTap="tap"
                  transition={{ type: 'spring', stiffness: 300, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                  title={'History'}
                >
                  <IconHistory xlinkTitle='History' size={32} />
                </MotionButton>
              </motion.div>

              <motion.div>
                <MotionButton
                  position="relative"
                  top={0}
                  right={0}
                  zIndex={10}
                  background="none"
                  color="#54c7e3"
                  borderRadius="8px"
                  paddingY="2px"
                  paddingX="5px"
                  fontSize="16px"
                  fontWeight="bold"
                  fontFamily="'Roboto', sans-serif"
                  textAlign="center"
                  _hover={{
                    fontsize: "20px",
                    color: "white",
                  }}
                  variants={buttonVariants}
                  initial="initial"
                  animate="initial"
                  whileHover="hover"
                  whileTap="tap"
                  transition={{ type: 'spring', stiffness: 300, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                  title={'Trending'}
                >
                  <IconBolt xlinkTitle='Trending' size={32} />
                </MotionButton>
              </motion.div>

              <motion.div>
                <MotionButton
                  position="relative"
                  top={0}
                  right={0}
                  zIndex={10}
                  background="none"
                  color="#54c7e3"
                  borderRadius="8px"
                  paddingY="2px"
                  paddingX="5px"
                  fontSize="16px"
                  fontWeight="bold"
                  fontFamily="'Roboto', sans-serif"
                  textAlign="center"
                  _hover={{
                    fontsize: "20px",
                    color: "white",
                  }}
                  variants={buttonVariants}
                  initial="initial"
                  animate="initial"
                  whileHover="hover"
                  whileTap="tap"
                  transition={{ type: 'spring', stiffness: 300, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                  title={'Sign In'}
                >
                  <IconUserCircle xlinkTitle='Sign In' size={32} />
                </MotionButton>
              </motion.div>

              <motion.div>
                <MotionButton
                  position="relative"
                  top={0}
                  right={0}
                  zIndex={10}
                  background="none"
                  color="#54c7e3"
                  borderRadius="8px"
                  paddingY="2px"
                  paddingX="5px"
                  fontSize="16px"
                  fontWeight="bold"
                  fontFamily="'Roboto', sans-serif"
                  textAlign="center"
                  _hover={{
                    fontsize: "20px",
                    color: "white",
                  }}
                  variants={buttonVariants}
                  initial="initial"
                  animate="initial"
                  whileHover="hover"
                  whileTap="tap"
                  transition={{ type: 'spring', stiffness: 300, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                  title={'Book Now'}
                >
                  <IconBook xlinkTitle='Book Now' size={32} />
                </MotionButton>
              </motion.div>
            </div>
          )}
        <div className="relative mx-2 flex justify-between w-full flex-grow flex-col rounded-3xl border border-black/10 bg-white shadow-[0_0_10px_rgba(0,0,0,0.10)] sm:mx-4">
          <button
            className="absolute left-2 top-2 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 "
            onClick={() => setShowPluginSelect(!showPluginSelect)}
            onKeyDown={(e) => { }}
          >
            {plugin ? <IconSearch size={25} /> : <IconSearch size={25} />}
          </button>

          {showPluginSelect && (
            <div className="absolute left-0 bottom-14 rounded bg-white ">
              <PluginSelect
                plugin={plugin}
                onKeyDown={(e: any) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowPluginSelect(false);
                    textareaRef.current?.focus();
                  }
                }}
                onPluginChange={(plugin: Plugin) => {
                  setPlugin(plugin);
                  setShowPluginSelect(false);

                  if (textareaRef && textareaRef.current) {
                    textareaRef.current.focus();
                  }
                }}
              />
            </div>
          )}

          <textarea
            ref={textareaRef}
            className="m-0 w-full resize-none border-0 bg-transparent px-3 py-3 pr-8 pl-10 text-black md:py-3 md:pl-10"
            style={{
              resize: 'none',
              bottom: `${textareaRef?.current?.scrollHeight}px`,
              maxHeight: '400px',
              overflow: `${textareaRef.current && textareaRef.current.scrollHeight > 400
                ? 'auto'
                : 'hidden'
                }`,
              paddingTop: "0.8rem",
              paddingBottom: "0.8rem"
            }}
            placeholder={!isRecorded && t('Type message or type / to select a prompt') || ''}
            value={content}
            rows={1}
            onCompositionStart={() => setIsTyping(true)}
            onCompositionEnd={() => setIsTyping(false)}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />

          <button
            className="absolute right-2 top-1 rounded-sm p-1 text-neutral-800 opacity-80 hover:bg-neutral-200 hover:text-neutral-900 "
            onClick={handleSend}
          >
            {messageIsStreaming ? (
              <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-neutral-800 opacity-80 dark:border-neutral-100"></div>
            ) : (

              <IconArrowRight
                className="rounded-full bg-black text-[#54c7e3]" size={28}
              />
            )}
          </button>
          <button
            className="absolute right-10 top-2 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 "
            onClick={handleStartRecording}
          ><IconMicrophone size={25} className=" text-[#54c7e3]" /> </button>
          {isRecording &&
            <div className={`bg-white absolute flex justify-center items-center h-full w-full text-black`}>
              <div className='text-black font-semibold text-sm'>
                <p>Recording {formatTime(timer)}</p>
              </div>
              <button className="absolute right-8 top-2 rounded-sm p-1 text-green-600 opacity-60 hover:bg-neutral-200" onClick={handleSaveRecording} ><IconCheck size={16} /></button>
              <button className="absolute right-2 top-2 rounded-sm p-1 text-red-600 opacity-60 hover:bg-neutral-200" onClick={handleStopRecording} ><IconX size={16} /></button>
            </div>
          }
          {isRecorded && (
            <div className={`absolute flex justify-center items-center h-full w-full text-black  text-sm font-semibold`}>
              <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-neutral-800 opacity-60 dark:border-neutral-100 mr-2"></div>
              Listening
            </div>
          )}

          {showScrollDownButton && window.innerWidth > 640 && (
            <div className="absolute bottom-12 right-0 lg:bottom-0 lg:-right-10">
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-300 text-gray-800 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-neutral-200"
                onClick={onScrollDownClick}
              >
                <IconArrowDown size={18} />
              </button>
            </div>
          )}

          {showPromptList && filteredPrompts.length > 0 && (
            <div className="absolute bottom-12 w-full">
              <PromptList
                activePromptIndex={activePromptIndex}
                prompts={filteredPrompts}
                onSelect={handleInitModal}
                onMouseOver={setActivePromptIndex}
                promptListRef={promptListRef}
              />
            </div>
          )}

          {isModalVisible && (
            <VariableModal
              prompt={prompts[activePromptIndex]}
              variables={variables}
              onSubmit={handleSubmit}
              onClose={() => setIsModalVisible(false)}
            />
          )}
        </div>
      </div>
      <div className="px-3 pt-2 pb-3 text-center text-[12px] text-black/50 dark:text-white/50 md:px-4 md:pt-3 md:pb-6 hidden">
        <a
          href="https://github.com/mckaywrigley/chatbot-ui"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          ChatBot UI
        </a>
        .{' '}
        {t(
          "Chatbot UI is an advanced chatbot kit for OpenAI's chat models aiming to mimic ChatGPT's interface and functionality.",
        )}
      </div>
      <PromptModal
        prompt={null}
        onClose={() => setShowModal(false)}
        onUpdatePrompt={handleCreatePrompt}
        showModal={showModal}
      />
    </div>
  );
};
