import {
  IconClearAll,
  IconFidgetSpinner,
  IconSettings,
  IconSettings2,
  IconTrash,
  IconTrashOff,
  IconTrashX,
} from '@tabler/icons-react';
import {
  MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';

import { useTranslation } from 'next-i18next';

import { getEndpoint } from '@/utils/app/api';
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { throttle } from '@/utils/data/throttle';

import { ChatBody, Conversation, Message } from '@/types/chat';
import { Plugin } from '@/types/plugin';

import HomeContext from '@/pages/api/home/home.context';

import Spinner from '../Spinner';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ErrorMessageDiv } from './ErrorMessageDiv';
import { MemoizedChatMessage } from './MemoizedChatMessage';
import { ModelSelect } from './ModelSelect';
import { SystemPrompt } from './SystemPrompt';
import { TemperatureSlider } from './Temperature';
import { ContextUrls } from './ContextUrls';

interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}

export const Chat = memo(({ stopConversationRef }: Props) => {
  const { t } = useTranslation('chat');

  const {
    state: {
      selectedConversation,
      conversations,
      models,
      apiKey,
      pluginKeys,
      serverSideApiKeyIsSet,
      messageIsStreaming,
      modelError,
      loading,
      loadingFollowUp,
      followUpQuestions,
      prompts,
      contextUrlChanged,
      isEnabledAutoRename
    },
    handleUpdateConversation,
    handleNewConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [currentMessage, setCurrentMessage] = useState<Message>();
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getFollowUpQuestions = useCallback(
    async (
    answer: String,
    question: String,
    updatedConversation: Conversation,
  ) => {
    homeDispatch({ field: 'loadingFollowUp', value: true });
    homeDispatch({ field: 'followUpQuestions', value: [] });
    const contextUrlString = getContextUrlString(updatedConversation);
    const messagesSuggested: Message = 
      {
        role: 'user',
        content: `Rules you must follow:\n- You only respond in JSON format\n- Read the following conversations between AI and Human and generate at most 3 follow-up messages or questions the Human can ask${contextUrlString ? "\n- It's good if you response based on this context: " + contextUrlString : ""}\n- Your response MUST be a valid JSON array of strings like this: [\"some question\", \"another question\"]\n- Each message in your response should be concise, no more than 15 words\n- You MUST write the follow-ups in English.\\n- Don't output anything other text\nThe conversation is:\nHuman: ${question}\nAI: ${answer}`,
      }
    let chatBody: ChatBody = {
      model: updatedConversation.model,
      messages: [
        ...updatedConversation.messages,
        messagesSuggested
      ],
      key: apiKey,
      prompt: updatedConversation.prompt,
      temperature: updatedConversation.temperature,
    };
    const controller = new AbortController();
    const responseSuggested = await fetch('api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(chatBody),
    });
    const dataSuggested = responseSuggested.body;
    if (dataSuggested) {
      const readerSuggested = dataSuggested.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let text = '';
      while (!done) {
        const { value, done: doneReading } = await readerSuggested.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        text += chunkValue;
      }
      try {
        homeDispatch({ field: 'followUpQuestions', value: JSON.parse(text) });
      } catch (e) {
        console.log(e);
        return false;
      }
      finally {
        homeDispatch({ field: 'loadingFollowUp', value: false });
      }
    }
  }, [apiKey, homeDispatch]);

  const handleSend = useCallback(
    async (message: Message, deleteCount = 0, plugin: Plugin | null = null) => {
      if (selectedConversation) {
        let question = '',
          answer = '' , converstationStopped = false;
        let updatedConversation: Conversation;
        if (deleteCount) {
          const updatedMessages = [...selectedConversation.messages];
          for (let i = 0; i < deleteCount; i++) {
            updatedMessages.pop();
          }
          updatedConversation = {
            ...selectedConversation,
            messages: [...updatedMessages, message],
          };
        } else {
          updatedConversation = {
            ...selectedConversation,
            messages: [...selectedConversation.messages, message],
          };
        }
        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        });
        homeDispatch({ field: 'loading', value: true });
        homeDispatch({ field: 'messageIsStreaming', value: true });
        let chatBody: ChatBody = {
          model: updatedConversation.model,
          messages: updatedConversation.contextUrls?.length > 0 ? 
            [
             ...updatedConversation.messages,
             {
              role: 'user',
              content: "The context of this conversation is about " +  getContextUrlString(updatedConversation)
             }
            ]
            :
            updatedConversation.messages,
          key: apiKey,
          prompt: updatedConversation.prompt,
          temperature: updatedConversation.temperature,
        };
        const endpoint = getEndpoint(plugin);
        let body;
        if (!plugin) {
          body = JSON.stringify(chatBody);
        } else {
          body = JSON.stringify({
            ...chatBody,
            googleAPIKey: pluginKeys
              .find((key) => key.pluginId === 'google-search')
              ?.requiredKeys.find((key) => key.key === 'GOOGLE_API_KEY')?.value,
            googleCSEId: pluginKeys
              .find((key) => key.pluginId === 'google-search')
              ?.requiredKeys.find((key) => key.key === 'GOOGLE_CSE_ID')?.value,
          });
        }
        const controller = new AbortController();
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body,
        });
        if (!response.ok) {
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          toast.error(response.statusText);
          return;
        }
        const data = response.body;
        if (!data) {
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          return;
        }
        if (!plugin) {
          if (updatedConversation.messages.length === 1 && isEnabledAutoRename) {
            const { content } = message;
            const customName =
              content.length > 30 ? content.substring(0, 30) + '...' : content;
            updatedConversation = {
              ...updatedConversation,
              name: customName,
            };
          }
          homeDispatch({ field: 'loading', value: false });
          const reader = data.getReader();
          const decoder = new TextDecoder();
          let done = false;
          let isFirst = true;
          let text = '';
          while (!done) {
            if (stopConversationRef.current === true) {
              controller.abort();
              done = true;
              converstationStopped = true;
              break;
            }
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunkValue = decoder.decode(value);
            text += chunkValue;
            if (isFirst) {
              isFirst = false;
              const updatedMessages: Message[] = [
                ...updatedConversation.messages,
                { role: 'assistant', content: chunkValue },
              ];
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              };
              homeDispatch({
                field: 'selectedConversation',
                value: updatedConversation,
              });
            } else {
              const updatedMessages: Message[] =
                updatedConversation.messages.map((message, index) => {
                  if (index === updatedConversation.messages.length - 1) {
                    return {
                      ...message,
                      content: text,
                    };
                  }
                  return message;
                });
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              };
              homeDispatch({
                field: 'selectedConversation',
                value: updatedConversation,
              });
            }
          }
          question = message.content;
          answer = text;
          saveConversation(updatedConversation);
          const updatedConversations: Conversation[] = conversations.map(
            (conversation) => {
              if (conversation.id === selectedConversation.id) {
                return updatedConversation;
              }
              return conversation;
            },
          );
          if (updatedConversations.length === 0) {
            updatedConversations.push(updatedConversation);
          }
          homeDispatch({ field: 'conversations', value: updatedConversations });
          saveConversations(updatedConversations);
          homeDispatch({ field: 'messageIsStreaming', value: false });
        } else {
          const { answer } = await response.json();
          const updatedMessages: Message[] = [
            ...updatedConversation.messages,
            { role: 'assistant', content: answer },
          ];
          updatedConversation = {
            ...updatedConversation,
            messages: updatedMessages,
          };
          homeDispatch({
            field: 'selectedConversation',
            value: updateConversation,
          });
          saveConversation(updatedConversation);
          const updatedConversations: Conversation[] = conversations.map(
            (conversation) => {
              if (conversation.id === selectedConversation.id) {
                return updatedConversation;
              }
              return conversation;
            },
          );
          if (updatedConversations.length === 0) {
            updatedConversations.push(updatedConversation);
          }
          homeDispatch({ field: 'conversations', value: updatedConversations });
          saveConversations(updatedConversations);
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
        }
        if (answer && question && !converstationStopped) {
          getFollowUpQuestions(answer, question, updatedConversation);
        }
      }
    },
    [
      apiKey,
      conversations,
      pluginKeys,
      selectedConversation,
      stopConversationRef,
      getFollowUpQuestions,
      handleUpdateConversation,
      homeDispatch
    ],
  );
  const getContextUrlString = (updatedConversation: Conversation) => {
    const contextUrlStr = updatedConversation.contextUrls ? updatedConversation.contextUrls.map(contextUrl => contextUrl.url).toString() : "";
    return contextUrlStr;
  }
  

  const scrollToBottom = useCallback(() => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      textareaRef.current?.focus();
    }
  }, [autoScrollEnabled]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const bottomTolerance = 30;

      if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        setAutoScrollEnabled(false);
        setShowScrollDownButton(true);
      } else {
        setAutoScrollEnabled(true);
        setShowScrollDownButton(false);
      }
    }
  };

  const handleScrollDown = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  const onClearAll = () => {
    if (
      confirm(t<string>('Are you sure you want to clear all messages?')) &&
      selectedConversation
    ) {
      handleUpdateConversation(selectedConversation, {
        key: 'messages',
        value: [],
      });
    }
  };

  const scrollDown = () => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView(true);
    }
  };

  const handleSendFollowUpQuestion = (content: string) => {
    const message: Message = { role: 'user', content };
    setCurrentMessage(message);
    handleSend(message, 0);
  };

  const throttledScrollDown = throttle(scrollDown, 250);

  useEffect(() => {
    throttledScrollDown();
    selectedConversation &&
      setCurrentMessage(
        selectedConversation.messages[selectedConversation.messages.length - 2],
      );
  }, [selectedConversation, throttledScrollDown]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting);
        if (entry.isIntersecting) {
          textareaRef.current?.focus();
        }
      },
      {
        root: null,
        threshold: 0.5,
      },
    );
    const messagesEndElement = messagesEndRef.current;
    if (messagesEndElement) {
      observer.observe(messagesEndElement);
    }
    return () => {
      if (messagesEndElement) {
        observer.unobserve(messagesEndElement);
      }
    };
  }, [messagesEndRef]);

  return (
    <div className="relative flex flex-grow h-screen flex-col overflow-auto bg-white transition-transform">
      {!(apiKey || serverSideApiKeyIsSet) ? (
        <div className="mx-auto flex h-full w-[300px] flex-col justify-center space-y-6 sm:w-[600px]">
          <div className="text-center text-7xl font-bold text-black">
            Genesis⚡️
          </div>
          <div className="text-center text-lg text-black ">
            <div className="mb-.05 font-bold">
              THE POWER OF CREATION, AT YOUR FINGERTIPS.
            </div>
          </div>
          <div className="text-center text-gray-500">
            <div className="mb-2">
              Genesis is committed to helping entrepreneurs like you create and
              grow successful businesses. Our AI-powered web app simplifies the
              complex world of entrepreneurship and makes it accessible for all.{' '}
            </div>
            <div className="mb-2">
              {t(
                'Please set your OpenAI API key in the bottom left of the sidebar.',
              )}
            </div>
            <div>
              {t("If you don't have an OpenAI API key, you can get one here: ")}
              <a
                href="https://platform.openai.com/account/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >
                openai.com
              </a>
            </div>
          </div>
        </div>
      ) : modelError ? (
        <ErrorMessageDiv error={modelError} />
      ) : (
        <>
          <div
            className="max-h-full overflow-x-hidden chat-content"
            ref={chatContainerRef}
            onScroll={handleScroll}
          >
            {selectedConversation?.messages.length === 0 ? (
              <>
                <div className="mx-auto flex flex-col space-y-5 md:space-y-10 px-3 pt-5 md:pt-12 sm:max-w-[600px] mb-28">
                  <div className="text-center text-3xl font-semibold text-gray-800">
                    {models.length === 0 ? (
                      <div>
                        <Spinner size="16px" className="mx-auto" />
                      </div>
                    ) : (
                      'Genesis⚡️'
                    )}
                  </div>

                  {models.length > 0 && (
                    <div className="flex h-full flex-col space-y-4 rounded-lg border border-neutral-200 p-4">
                      <ModelSelect />

                      <SystemPrompt
                        conversation={selectedConversation}
                        prompts={prompts}
                        onChangePrompt={(prompt) =>
                          handleUpdateConversation(selectedConversation, {
                            key: 'prompt',
                            value: prompt,
                          })
                        }
                      />
                      <TemperatureSlider
                        label={t('Temperature')}
                        onChangeTemperature={(temperature) =>
                          handleUpdateConversation(selectedConversation, {
                            key: 'temperature',
                            value: temperature,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="justify-left border-b backdrop-blur-lg z-40 fixed top-0 left-0 w-full flex bg-white/80 py-3 px-10 shrink-0 text-[#3d3d3d]">
                  <div className="text-left text-sm font-bold text-black">
                    Genesis⚡️&nbsp;
                  </div>
                  <div className="topbar">
                    {`"${selectedConversation?.name}"`}
                  </div>
                </div>
                {showSettings && (
                  <div className="flex flex-col space-y-10 md:mx-auto md:max-w-xl md:gap-6 md:py-3 md:pt-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
                    <div className="flex h-full flex-col space-y-4 border-b border-neutral-200 p-4 md:rounded-lg md:border">
                      <ModelSelect />
                    </div>
                  </div>
                )}

                {selectedConversation?.messages.map((message, index) => (
                  <MemoizedChatMessage
                    key={index}
                    message={message}
                    messageIndex={index}
                    onEdit={(editedMessage) => {
                      setCurrentMessage(editedMessage);
                      // discard edited message and the ones that come after then resend
                      handleSend(
                        editedMessage,
                        selectedConversation?.messages.length - index,
                      );
                    }}
                  />
                ))}

                {loading && <ChatLoader />}
                <div className="bret_blank"></div>
                <div className="text-black flex items-center flex-col mt-8 mb-4">
                  {loadingFollowUp && (
                    <div className="text-black flex items-center">
                      <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-neutral-800 opacity-60 dark:border-neutral-100 mr-2"></div>{' '}
                      Generating follow-up questions
                    </div>
                  )}
                  {!messageIsStreaming &&
                    selectedConversation &&
                    followUpQuestions?.length > 0 && (
                      <div className='p-3 text-center'>
                        <div className="font-semibold mb-2">
                          Suggested Follow-up Questions
                        </div>
                        <div className="mb-2 text-xs text-gray-500">
                          Stop showing this
                        </div>
                        {followUpQuestions.map((question, index) => (
                          <div
                            key={index}
                            className="text-xs border rounded-2xl px-2 py-1 mb-2 cursor-pointer"
                            onClick={() => handleSendFollowUpQuestion(question)}
                          >
                            {question}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
                <div className="h-[162px] bg-white" ref={messagesEndRef} />
              </>
            )}
          </div>

          <ChatInput
            stopConversationRef={stopConversationRef}
            textareaRef={textareaRef}
            onSend={(message, plugin) => {
              setCurrentMessage(message);
              handleSend(message, 0, plugin);
            }}
            onScrollDownClick={handleScrollDown}
            onRegenerate={() => {
              if (currentMessage) {
                handleSend(currentMessage, 2, null);
              }
              else if(selectedConversation && selectedConversation.messages.length > 0) {
                const messageTmp = selectedConversation.messages[selectedConversation.messages.length - 1]
                setCurrentMessage(messageTmp);
                handleSend(messageTmp, 2, null);
              }
            }}
            showScrollDownButton={showScrollDownButton}
            onNewConversation={() => handleNewConversation(null)}
            handleSettings={handleSettings}
            onClearAll={onClearAll}
            showSettings={showSettings}
          />
        </>
      )}
    </div>
  );
});
Chat.displayName = 'Chat';
