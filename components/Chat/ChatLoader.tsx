import { SiOpenai } from '@icons-pack/react-simple-icons';
import { IconDots } from '@tabler/icons-react';
import { FC } from 'react';

interface Props {}

export const ChatLoader: FC<Props> = () => {
  return (
    <div
      className="rounded-2xl p-1 group border-none border-black/10 bg-gray-0 text-gray-800 mx-auto "
      style={{ overflowWrap: 'anywhere', maxWidth: '720px' }}
    >
      <div className="relative flex items-start prose">
        <div className="h-10 w-10 rounded-xl inline-flex items-center justify-center mr-2 bg-teal-500 text-white flex-shrink-0">
          <SiOpenai size={30} />
        </div>
        <IconDots className="animate-pulse" />
      </div>
    </div>
  );
};
