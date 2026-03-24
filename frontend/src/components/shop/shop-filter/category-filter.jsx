import React from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import ErrorMsg from "@/components/common/error-msg";
import { useGetShowCategoryQuery } from "@/redux/features/categoryApi";
import { handleFilterSidebarClose } from "@/redux/features/shop-filter-slice";

const CategoryFilter = ({ setCurrPage }) => {
  const { data: categories, isLoading, isError } = useGetShowCategoryQuery();
  const router = useRouter();
  const dispatch = useDispatch();

  const handleCategoryRoute = (title) => {
    setCurrPage(1);
    const slug = title.toLowerCase().replace("&", "").split(" ").join("-");
    router.push(`/shop?category=${slug}`);
    dispatch(handleFilterSidebarClose());
  };

  let content = null;

  if (isLoading) {
    content = (
      <ul className="cl-shop__category-list">
        {[...Array(6)].map((_, i) => (
          <li key={i} className="cl-shop__category-item">
            <div className="cl-skeleton cl-skeleton--line" style={{ width: '100%', height: 16 }} />
          </li>
        ))}
      </ul>
    );
  } else if (isError) {
    content = <ErrorMsg msg="There was an error" />;
  } else if (!categories?.result?.length) {
    content = <ErrorMsg msg="No Category found!" />;
  } else {
    const activeSlug = router.query.category || '';
    content = (
      <ul className="cl-shop__category-list">
        {categories.result.map((item) => {
          const slug = item.parent.toLowerCase().replace("&", "").split(" ").join("-");
          const isActive = activeSlug === slug;
          return (
            <li key={item._id}>
              <label className={`cl-shop__category-item${isActive ? ' cl-shop__category-item--active' : ''}`}>
                <input
                  type="radio"
                  name="category"
                  checked={isActive}
                  onChange={() => handleCategoryRoute(item.parent)}
                />
                {item.parent}
              </label>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="cl-shop__widget">
      <h3 className="cl-shop__widget-title">Category</h3>
      {content}
    </div>
  );
};

export default CategoryFilter;
