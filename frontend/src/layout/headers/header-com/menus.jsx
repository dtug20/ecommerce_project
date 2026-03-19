import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useGetShowCategoryQuery } from "@/redux/features/categoryApi";

const MAX_MENU_CATEGORIES = 5;

const buildCategorySlug = (title) =>
  title.toLowerCase().replace("&", "").split(" ").join("-");

const Menus = () => {
  const { t } = useTranslation();
  const { data: categories, isError, isLoading } = useGetShowCategoryQuery();

  const category_items = categories?.result || [];

  // Filter to show only featured categories (capped), or fallback if none are featured
  let menuCategories = category_items.filter((cat) => cat.featured).slice(0, MAX_MENU_CATEGORIES);
  if (menuCategories.length === 0) {
    menuCategories = category_items.slice(0, MAX_MENU_CATEGORIES);
  }

  return (
    <ul>
      <li>
        <Link href="/">{t("nav.home")}</Link>
      </li>
      <li>
        <Link href="/shop">{t("nav.shop")}</Link>
      </li>
      {!isLoading && !isError && menuCategories.map((item) => (
        <li key={item._id} className={item.children && item.children.length > 0 ? "has-dropdown" : ""}>
          <Link href={`/shop?category=${buildCategorySlug(item.parent)}`}>
            {item.parent}
          </Link>
          {item.children && item.children.length > 0 && (
            <ul className="tp-submenu">
              {item.children.map((child, i) => (
                <li key={i}>
                  <Link href={`/shop?subCategory=${buildCategorySlug(child)}`}>
                    {child}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
      <li>
        <Link href="/coupon">{t("nav.coupons")}</Link>
      </li>
    </ul>
  );
};

export default Menus;
