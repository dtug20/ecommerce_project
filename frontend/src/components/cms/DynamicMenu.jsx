import React from 'react';
import Link from 'next/link';

const getItemUrl = (item) => {
  switch (item.type) {
    case 'category':
      return item.reference?.id
        ? `/shop?category=${item.reference.id}`
        : item.url || '#';
    case 'page':
      return item.url ? `/${item.url}` : '#';
    case 'link':
    case 'custom':
    case 'external':
      return item.url || '#';
    default:
      return item.url || '#';
  }
};

const DynamicMenuItem = ({ item }) => {
  const url = getItemUrl(item);
  const visibleChildren = (item.children || []).filter(
    (child) => child.isVisible !== false
  );
  const hasChildren = visibleChildren.length > 0;

  return (
    <li className={hasChildren ? 'has-dropdown' : ''}>
      <Link href={url} target={item.target || '_self'}>
        {item.label}
      </Link>
      {hasChildren && (
        <ul className="tp-submenu">
          {visibleChildren.map((child, idx) => (
            <DynamicMenuItem key={child._id || idx} item={child} />
          ))}
        </ul>
      )}
    </li>
  );
};

const DynamicMenu = ({ items = [] }) => {
  const visibleItems = items.filter((item) => item.isVisible !== false);

  return (
    <ul>
      {visibleItems.map((item, idx) => (
        <DynamicMenuItem key={item._id || idx} item={item} />
      ))}
    </ul>
  );
};

export default DynamicMenu;
