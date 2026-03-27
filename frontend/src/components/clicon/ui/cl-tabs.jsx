import React, { useState } from 'react';

/**
 * Clicon tab component with underline and pill variants.
 *
 * @param {Object} props
 * @param {{ key: string, label: string, content: React.ReactNode }[]} props.items
 * @param {string} [props.defaultActiveKey] - Initial active tab key
 * @param {'underline'|'pill'} [props.variant='underline']
 * @param {string} [props.className]
 */
const ClTabs = ({ items, defaultActiveKey, variant = 'underline', className = '' }) => {
  const [activeKey, setActiveKey] = useState(defaultActiveKey || items[0]?.key);

  const activeItem = items.find((item) => item.key === activeKey);

  return (
    <div className={`cl-tabs cl-tabs--${variant}${className ? ` ${className}` : ''}`}>
      <div className="cl-tabs__nav" role="tablist">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`cl-tabs__tab${activeKey === item.key ? ' cl-tabs__tab--active' : ''}`}
            role="tab"
            aria-selected={activeKey === item.key}
            aria-controls={`cl-tabpanel-${item.key}`}
            id={`cl-tab-${item.key}`}
            onClick={() => setActiveKey(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {activeItem && (
        <div
          className="cl-tabs__panel"
          role="tabpanel"
          id={`cl-tabpanel-${activeItem.key}`}
          aria-labelledby={`cl-tab-${activeItem.key}`}
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
};

export default ClTabs;
