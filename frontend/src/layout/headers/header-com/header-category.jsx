import React from "react";
import Image from "next/image";
import { useRouter } from "next/router";
// internal
import { useGetShowCategoryQuery } from "@/redux/features/categoryApi";
import ErrorMsg from "@/components/common/error-msg";
import Loader from "@/components/loader/loader";

const HeaderCategory = ({ isCategoryActive }) => {
  const {
    data: categories,
    isError,
    isLoading,
  } = useGetShowCategoryQuery();
  const router = useRouter();

  // handle category route
  const handleCategoryRoute = (title, route) => {
    if (route === "parent") {
      router.push(
        `/shop?category=${title
          .toLowerCase()
          .replace("&", "")
          .split(" ")
          .join("-")}`
      );
    } else {
      router.push(
        `/shop?subCategory=${title
          .toLowerCase()
          .replace("&", "")
          .split(" ")
          .join("-")}`
      );
    }
  };

  // decide what to render
  let content = null;

  if (isLoading) {
    content = (
      <div className="py-5">
        <Loader loading={isLoading} />
      </div>
    );
  }
  if (!isLoading && isError) {
    content = <ErrorMsg msg="There was an error" />;
  }
  if (!isLoading && !isError && categories?.result?.length === 0) {
    content = <ErrorMsg msg="No Category found!" />;
  }
  if (!isLoading && !isError && categories?.result?.length > 0) {
    const category_items = categories.result;

    // Use the exact 5 predefined default types
    const defaultTypes = ["fashion", "electronics", "beauty", "jewelry", "other"];

    // Group categories by strictly the default productTypes
    const grouped = defaultTypes.reduce((acc, type) => {
      acc[type] = category_items.filter(cat => cat.productType === type);
      return acc;
    }, {});

    content = defaultTypes.map((type, idx) => {
      const cats = grouped[type] || [];
      return (
      <li className="has-dropdown" key={idx}>
        <a
          className="cursor-pointer"
          onClick={() => router.push(`/shop?categoryType=${type}`)}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </a>

        {cats.length > 0 && (
          <ul className="tp-submenu">
            {cats.map((item) => (
              <li
                key={item._id}
                className={item.children && item.children.length > 0 ? "has-dropdown" : ""}
              >
                <a
                  className="cursor-pointer"
                  onClick={() => handleCategoryRoute(item.parent, "parent")}
                >
                  {item.img && (
                    <span>
                      <Image src={item.img} alt="cate img" width={50} height={50} />
                    </span>
                  )}
                  {item.parent}
                </a>

                {item.children && item.children.length > 0 && (
                  <ul className="tp-submenu">
                    {item.children.map((child, i) => (
                      <li
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCategoryRoute(child, "children");
                        }}
                      >
                        <a className="cursor-pointer">{child}</a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </li>
    )});
  }
  return <ul className={isCategoryActive ? "active" : ""}>{content}</ul>;
};

export default HeaderCategory;
