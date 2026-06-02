import React, { useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import ErrorMsg from "@/components/common/error-msg";
import { useGetShowCategoryQuery } from "@/redux/features/categoryApi";
import { handleFilterSidebarClose } from "@/redux/features/shop-filter-slice";

// Match the backend category/subCategory resolver (store.controller): lowercase,
// strip '&', collapse whitespace, join with '-'. Keeps sidebar slugs resolvable.
const slugify = (s) =>
  String(s).toLowerCase().replace(/&/g, "").split(/\s+/).filter(Boolean).join("-");

const CategoryFilter = ({ setCurrPage }) => {
  const { t } = useTranslation();
  const { data: categories, isLoading, isError } = useGetShowCategoryQuery();
  const router = useRouter();
  const dispatch = useDispatch();
  // undefined = follow the active category; otherwise the parent the user toggled open
  const [openId, setOpenId] = useState(undefined);

  const activeCat = router.query.category || "";
  const activeSub = router.query.subCategory || "";

  // Merge into the existing query (preserve price/brand/sort/search) instead of
  // replacing the URL. category and subCategory are mutually exclusive.
  const applyFilter = (patch) => {
    if (setCurrPage) setCurrPage(1);
    const nextQuery = { ...router.query, page: 1, ...patch };
    Object.keys(nextQuery).forEach((key) => {
      if (!nextQuery[key]) delete nextQuery[key];
    });
    router.push({ pathname: "/shop", query: nextQuery }, undefined, { shallow: true });
    dispatch(handleFilterSidebarClose());
  };

  const selectParent = (parent) =>
    applyFilter({ category: slugify(parent), subCategory: undefined });
  const selectChild = (child) =>
    applyFilter({ subCategory: slugify(child), category: undefined });
  const clearAll = () => applyFilter({ category: undefined, subCategory: undefined });

  let content = null;

  if (isLoading) {
    content = (
      <ul className="cl-shop__category-list">
        {[...Array(6)].map((_, i) => (
          <li key={i} className="cl-shop__category-item">
            <div className="cl-skeleton cl-skeleton--line" style={{ width: "100%", height: 16 }} />
          </li>
        ))}
      </ul>
    );
  } else if (isError) {
    content = <ErrorMsg msg={t("error.generic")} />;
  } else if (!categories?.result?.length) {
    content = <ErrorMsg msg={t("error.noCategoryFound")} />;
  } else {
    const hasFilter = Boolean(activeCat || activeSub);
    content = (
      <ul className="cl-shop__category-list">
        <li>
          <button
            type="button"
            className={`cl-shop__category-row${!hasFilter ? " cl-shop__category-row--active" : ""}`}
            onClick={clearAll}
          >
            {t("shop.allCategories")}
          </button>
        </li>

        {categories.result.map((item) => {
          const parentSlug = slugify(item.parent);
          const children = Array.isArray(item.children) ? item.children.filter(Boolean) : [];
          const isParentActive = activeCat === parentSlug;
          const hasActiveChild = children.some((c) => slugify(c) === activeSub);
          const isOpen =
            openId !== undefined ? openId === item._id : isParentActive || hasActiveChild;

          return (
            <li key={item._id} className="cl-shop__category-group">
              <div className="cl-shop__category-row-wrap">
                <button
                  type="button"
                  className={`cl-shop__category-row${isParentActive ? " cl-shop__category-row--active" : ""}`}
                  onClick={() => selectParent(item.parent)}
                >
                  {item.parent}
                </button>
                {children.length > 0 && (
                  <button
                    type="button"
                    className="cl-shop__category-toggle"
                    aria-label={`toggle ${item.parent}`}
                    aria-expanded={isOpen}
                    onClick={() => setOpenId(isOpen ? null : item._id)}
                  >
                    <i className={`fas fa-chevron-${isOpen ? "down" : "right"}`} />
                  </button>
                )}
              </div>

              {children.length > 0 && isOpen && (
                <ul className="cl-shop__subcategory-list">
                  {children.map((child, i) => {
                    const isChildActive = activeSub === slugify(child);
                    return (
                      <li key={i}>
                        <button
                          type="button"
                          className={`cl-shop__subcategory-item${isChildActive ? " cl-shop__subcategory-item--active" : ""}`}
                          onClick={() => selectChild(child)}
                        >
                          {child}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="cl-shop__widget">
      <h3 className="cl-shop__widget-title">{t("shop.categories")}</h3>
      {content}
    </div>
  );
};

export default CategoryFilter;
