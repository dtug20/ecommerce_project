import React from 'react';
import { useGetBannersQuery } from '@/redux/features/cmsApi';
import AnnouncementBar from './AnnouncementBar';

/**
 * Fetches the active announcement-bar banner from the CMS and renders it.
 * Admin creates/edits announcement bars in CRM → CMS Banners (type: announcement-bar).
 * Only the first active banner is shown.
 */
const AnnouncementBarContainer = () => {
  const { data } = useGetBannersQuery({ type: 'announcement-bar' });
  const banners = data?.data || [];
  const activeBanner = banners.find((b) => b.status === 'active') || null;

  if (!activeBanner) return null;

  return <AnnouncementBar banner={activeBanner} />;
};

export default AnnouncementBarContainer;
