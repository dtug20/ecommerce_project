import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useGetShowCategoryQuery } from "@/redux/features/categoryApi";
import { useGetMenuQuery } from "@/redux/features/cmsApi";
import DynamicMenu from "@/components/cms/DynamicMenu";

const MAX_MENU_CATEGORIES = 5;

const buildCategorySlug = (title) =>
  title.toLowerCase().replace("&", "").split(" ").join("-");

const Menus = () => {
  const { t } = useTranslation();
  const { data: cmsMenu, isLoading: menuLoading } = useGetMenuQuery('header-main');
  const { data: categories, isError, isLoading } = useGetShowCategoryQuery();

  // If CMS menu is available and has items, use it
  if (!menuLoading && cmsMenu?.data?.items?.length > 0) {
    return <DynamicMenu items={cmsMenu.data.items} />;
  }

  // Fallback to category-based menu
  const category_items = categories?.result || [];
  let menuCategories = [...category_items]
    .filter((cat) => cat.featured)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, MAX_MENU_CATEGORIES);
  if (menuCategories.length === 0) {
    menuCategories = category_items.slice(0, MAX_MENU_CATEGORIES);
  }

  return (
    <ul>
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
