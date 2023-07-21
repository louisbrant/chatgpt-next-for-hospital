import { IconX, IconSearch } from '@tabler/icons-react';
import { FC } from 'react';

import { useTranslation } from 'next-i18next';
import { black } from 'kleur/colors';

interface Props {
  placeholder: string;
  searchTerm: string;
  onSearch: (searchTerm: string) => void;
}

const Search: FC<Props> = ({ placeholder, searchTerm, onSearch }) => {
  const { t } = useTranslation('sidebar');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  const clearSearch = () => {
    onSearch('');
  };

  return (
    <div className="relative flex items-center">
      <input
        className="flex-1 border border-neutral-400 py-3 pr-10 text-[14px] leading-3 text-left w-60 h-8 px-1.5 text-black"
        style={{borderRadius:"50px", paddingLeft: "30px"}}
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
      />

      {searchTerm && (
        <IconX
          className="absolute right-4 cursor-pointer text-neutral-300 hover:text-neutral-400"
          size={18}
          onClick={clearSearch}
        />
      )}
      <IconSearch style={{position:"absolute", marginLeft:"10px"}} color={"black"} size={18}/>
    </div>
  );
};

export default Search;
