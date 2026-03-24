import React from "react";
import { useDispatch } from "react-redux";
import { handleFilterSidebarOpen } from "@/redux/features/shop-filter-slice";

const SORT_OPTIONS = [
  { value: 'Default Sorting', label: 'Most Popular' },
  { value: 'Low to High', label: 'Price: Low to High' },
  { value: 'High to Low', label: 'Price: High to Low' },
  { value: 'New Added', label: 'Newest' },
];

const ShopTopRight = ({ selectHandleFilter }) => {
  const dispatch = useDispatch();

  return (
    <div className="cl-shop__topbar-right">
      <div className="cl-shop__topbar-sort">
        <label>Sort by:</label>
        <select
          onChange={(e) => selectHandleFilter(e)}
          defaultValue="Default Sorting"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="cl-shop__topbar-filter-btn"
        onClick={() => dispatch(handleFilterSidebarOpen())}
      >
        <i className="fa-solid fa-sliders" /> Filter
      </button>
    </div>
  );
};

export default ShopTopRight;
