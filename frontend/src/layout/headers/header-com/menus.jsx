import React from "react";
import { useRouter } from "next/router";
import { useGetShowCategoryQuery } from "@/redux/features/categoryApi";

const Menus = () => {
  const router = useRouter();
  const { data: categories, isError, isLoading } = useGetShowCategoryQuery();

  // handle category route
  const handleCategoryRoute = (title, route) => {
    if (route === "parent") {
      router.push(
        `/shop?category=${title.toLowerCase().replace("&", "").split(" ").join("-")}`
      );
    } else {
      router.push(
        `/shop?subCategory=${title.toLowerCase().replace("&", "").split(" ").join("-")}`
      );
    }
  };

  if (isLoading || isError) {
    return <ul></ul>;
  }

  const category_items = categories?.result || [];

  // Filter to show only featured categories, or fallback if none are featured
  let menuCategories = category_items.filter((cat) => cat.featured);
  if (menuCategories.length === 0) {
    menuCategories = category_items;
  }
  // Limit to maximum 5 items to avoid overcrowding the main menu layout (col-xl-6)
  menuCategories = menuCategories.slice(0, 5);

  return (
    <ul>
      {menuCategories.map((item) => (
        <li key={item._id} className={item.children && item.children.length > 0 ? "has-dropdown" : ""}>
          <a className="cursor-pointer" onClick={() => handleCategoryRoute(item.parent, "parent")}>
            {item.parent}
          </a>
          {item.children && item.children.length > 0 && (
            <ul className="tp-submenu">
              {item.children.map((child, i) => (
                <li key={i}>
                  <a className="cursor-pointer" onClick={() => handleCategoryRoute(child, "children")}>
                    {child}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
};

export default Menus;
