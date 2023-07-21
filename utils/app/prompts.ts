import { Prompt } from '@/types/prompt';
import { v4 as uuidv4 } from 'uuid';

export const updatePrompt = (updatedPrompt: Prompt, allPrompts: Prompt[]) => {
  const updatedPrompts = allPrompts.map((c) => {
    if (c.id === updatedPrompt.id) {
      return updatedPrompt;
    }

    return c;
  });

  savePrompts(updatedPrompts);

  return {
    single: updatedPrompt,
    all: updatedPrompts,
  };
};

export const savePrompts = (prompts: Prompt[]) => {
  localStorage.setItem('prompts', JSON.stringify(prompts));
};

export const newPromptItem = () => {
  const newPromptItem: Prompt = {
    id: uuidv4(),
    name: '+ New Prompt',
    description: '',
    content: '',
    model: null,
    folderId: null,
  };
  return newPromptItem
}


