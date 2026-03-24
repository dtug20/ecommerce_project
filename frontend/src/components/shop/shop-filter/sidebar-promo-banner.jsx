import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useGetBannersQuery } from "@/redux/features/cmsApi";

const SidebarPromoBanner = () => {
  const { t } = useTranslation();
  const { data: bannersData } = useGetBannersQuery({});

  const banners = bannersData?.data || bannersData || [];
  const banner = Array.isArray(banners) ? banners[0] : null;

  if (!banner) return null;

  return (
    <div className="cl-shop__widget">
      <div className="cl-shop__sidebar-banner">
        {banner.image && (
          <Image
            src={banner.image}
            alt={banner.title || 'Promotional Banner'}
            width={280}
            height={350}
            className="cl-shop__sidebar-banner-img"
            style={{ objectFit: 'cover' }}
            unoptimized
          />
        )}
        <div className="cl-shop__sidebar-banner-content">
          {banner.subtitle && (
            <p className="cl-shop__sidebar-banner-subtitle">{banner.subtitle}</p>
          )}
          {banner.title && (
            <h4 className="cl-shop__sidebar-banner-title">{banner.title}</h4>
          )}
          {banner.price && (
            <span className="cl-shop__sidebar-banner-price">{banner.price}</span>
          )}
          <div className="cl-shop__sidebar-banner-actions">
            {banner.link && (
              <Link href={banner.link} className="cl-shop__sidebar-banner-btn">
                <i className="fa-solid fa-cart-shopping" /> {t('product.addToCart').toUpperCase()}
              </Link>
            )}
            {banner.link && (
              <Link href={banner.link} className="cl-shop__sidebar-banner-btn-outlined">
                {t('common.viewAll').toUpperCase()} <i className="fa-solid fa-arrow-right" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarPromoBanner;
