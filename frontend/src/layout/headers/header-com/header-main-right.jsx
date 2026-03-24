import React from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useTranslation } from "react-i18next";
// internal
import useCartInfo from "@/hooks/use-cart-info";
import { CartTwo, Compare, Menu, Wishlist } from "@/svg";
import { openCartMini } from "@/redux/features/cartSlice";

const HeaderMainRight = ({ setIsCanvasOpen }) => {
  const { t } = useTranslation();
  const { user: userInfo } = useSelector((state) => state.auth);
  const { wishlist } = useSelector((state) => state.wishlist);
  const { quantity } = useCartInfo();
  const dispatch = useDispatch()
  return (
    <div className="tp-header-main-right d-flex align-items-center justify-content-end">
      <div className="tp-header-action d-flex align-items-center">
        {/* user */}
        <div className="tp-header-action-item d-none d-lg-block">
          {userInfo?.name ? (
            <Link href="/profile" className="tp-header-user-link">
              {t("header.helloName", { name: userInfo.name })}
            </Link>
          ) : (
            <Link href="/login" className="tp-header-user-link">
              {t("header.login")}
            </Link>
          )}
        </div>
        {/* compare */}
        <div className="tp-header-action-item d-none d-lg-block">
          <Link href="/compare" className="tp-header-action-btn">
            <Compare />
          </Link>
        </div>
        {/* wishlist */}
        <div className="tp-header-action-item d-none d-lg-block">
          <Link href="/wishlist" className="tp-header-action-btn">
            <Wishlist />
            <span className="tp-header-action-badge">{wishlist.length}</span>
          </Link>
        </div>
        {/* cart */}
        <div className="tp-header-action-item">
          <button
            onClick={() => dispatch(openCartMini())}
            type="button"
            className="tp-header-action-btn cartmini-open-btn"
          >
            <CartTwo />
            <span className="tp-header-action-badge">{quantity}</span>
          </button>
        </div>
        {/* mobile menu */}
        <div className="tp-header-action-item d-lg-none">
          <button
            onClick={() => setIsCanvasOpen(true)}
            type="button"
            className="tp-header-action-btn tp-offcanvas-open-btn"
          >
            <Menu />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeaderMainRight;
