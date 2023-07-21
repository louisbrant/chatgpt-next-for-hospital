import { MouseEventHandler, ReactElement } from 'react';
import styles from './SidebarActionButton.module.css';

interface Props {
  handleClick: MouseEventHandler<HTMLButtonElement>;
  children: ReactElement;
  hoverColor?: 'green' | 'red';
}

const SidebarActionButton = ({ handleClick, children, hoverColor }: Props) => {
  const hoverClass =
    hoverColor === 'green'
      ? styles.greenHover
      : hoverColor === 'red'
      ? styles.redHover
      : '';

  return (
    <button
      className={`${styles.button} ${hoverClass}`}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export default SidebarActionButton;
