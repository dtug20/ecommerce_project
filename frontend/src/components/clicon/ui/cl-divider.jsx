import React from 'react';

/**
 * Styled horizontal rule / divider.
 *
 * @param {Object} props
 * @param {string} [props.label] - Optional centered label text
 * @param {number} [props.spacing=16] - Vertical margin in px
 * @param {string} [props.className]
 */
const ClDivider = ({ label, spacing = 16, className = '' }) => {
  if (label) {
    return (
      <div
        className={`cl-divider cl-divider--labeled${className ? ` ${className}` : ''}`}
        style={{ margin: `${spacing}px 0` }}
      >
        <span className="cl-divider__line" />
        <span className="cl-divider__label">{label}</span>
        <span className="cl-divider__line" />
      </div>
    );
  }

  return (
    <hr
      className={`cl-divider${className ? ` ${className}` : ''}`}
      style={{ margin: `${spacing}px 0` }}
    />
  );
};

export default ClDivider;
