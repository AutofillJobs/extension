import React from 'react';

interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filter: string) => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({ onSearch, onFilter }) => {
  return (
    <div className="search-filter-container">
      <div className="search-group">
        <input
          type="text"
          id="searchInput"
          placeholder="Search by Job or Company"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="tab-buttons filter-controls" role="tablist">
        {['All', 'Today', '1 Month'].map((label) => (
          <button
            key={label}
            className="tab"
            onClick={() => onFilter(label)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchAndFilter;