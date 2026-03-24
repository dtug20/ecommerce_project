import React, { useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

const ShopTopLeft = ({ handleFilterChange }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(router.query.search || '');

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (handleFilterChange) {
      handleFilterChange({ search: searchValue || undefined, page: 1 });
    }
  }, [searchValue, handleFilterChange]);

  return (
    <div className="cl-shop__topbar-search">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder={t('shop.searchPlaceholder')}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <button type="submit" className="cl-shop__topbar-search-icon">
          <i className="fa-solid fa-magnifying-glass" />
        </button>
      </form>
    </div>
  );
};

export default ShopTopLeft;
