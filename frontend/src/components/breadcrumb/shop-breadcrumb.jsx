import React from 'react';
import Link from 'next/link';

const ShopBreadcrumb = ({ links = [] }) => {
  return (
    <nav className="cl-breadcrumb">
      <div className="container">
        <ol className="cl-breadcrumb__list">
          {links.map((item, i) => {
            const isLast = i === links.length - 1;
            return (
              <React.Fragment key={i}>
                {i > 0 && <li className="cl-breadcrumb__separator">&gt;</li>}
                <li className={`cl-breadcrumb__item${isLast ? ' cl-breadcrumb__item--active' : ''}`}>
                  {item.href && !isLast ? (
                    <Link href={item.href}>{item.label}</Link>
                  ) : (
                    item.label
                  )}
                </li>
              </React.Fragment>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default ShopBreadcrumb;
