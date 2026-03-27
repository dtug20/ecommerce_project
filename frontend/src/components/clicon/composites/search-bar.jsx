import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

/**
 * SearchBar composite — category dropdown + search input + submit button.
 * Matches Clicon header search pattern.
 *
 * @param {Object} props
 * @param {{ value: string, label: string }[]} [props.categories] - Category options
 * @param {string} [props.placeholder]
 * @param {function} [props.onSearch] - Custom handler (overrides default router navigation)
 * @param {string} [props.className]
 */
const CliconSearchBar = ({ categories = [], placeholder, onSearch, className = '' }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (onSearch) {
      onSearch(query.trim(), category || undefined);
    } else {
      const params = new URLSearchParams({ search: query.trim() });
      if (category) params.set('category', category);
      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <form
      className={`cl-search-bar${className ? ` ${className}` : ''}`}
      onSubmit={handleSubmit}
      role="search"
    >
      {categories.length > 0 && (
        <select
          className="cl-search-bar__category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label={t('search.category', 'Category')}
        >
          <option value="">{t('search.allCategories', 'All Categories')}</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      )}
      <input
        ref={inputRef}
        type="text"
        className="cl-search-bar__input"
        placeholder={placeholder || t('search.placeholder', 'Search for anything...')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={t('search.label', 'Search products')}
      />
      <button
        type="submit"
        className="cl-search-bar__btn"
        aria-label={t('search.submit', 'Search')}
      >
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
      </button>
    </form>
  );
};

export default CliconSearchBar;
