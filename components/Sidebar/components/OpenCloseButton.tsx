import {
  IconArrowBarLeft,
  IconArrowBarRight,
  IconBulb,
  IconMenu,
  IconMenu2,
  IconX,
} from '@tabler/icons-react';

interface Props {
  onClick: any;
  side: 'left' | 'right';
}

export const OpenSidebarButton = ({ onClick, side }: Props) => {
  return (
    <button
      className={`fixed top-2 ${
        side === 'right' ? 'right-2' : 'left-2'
      } z-50 h-7 w-7 text-black hover:text-gray-400  sm:top-02 sm:${
        side === 'right' ? 'right-2' : 'left-2'
      } sm:h-7 sm:w-7 sm:text-neutral-700 text-[#3d3d3d]`}
      onClick={onClick}
    >
      {side === 'right' ? <IconBulb /> : <IconMenu2 />}
    </button>
  );
};
