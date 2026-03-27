import React from 'react';

/**
 * Reusable skeleton placeholder for loading states.
 *
 * @param {Object} props
 * @param {'rect'|'circle'|'line'} [props.variant='rect'] - Shape variant
 * @param {number|string} [props.width] - Width (px or CSS value)
 * @param {number|string} [props.height] - Height (px or CSS value)
 * @param {number} [props.count=1] - Repeat N skeleton elements
 * @param {number} [props.gap=8] - Gap between repeated elements (px)
 * @param {string} [props.className] - Additional CSS class
 */
const SkeletonLoader = ({
  variant = 'rect',
  width,
  height,
  count = 1,
  gap = 8,
  className = '',
}) => {
  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  const elements = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`cl-skeleton cl-skeleton--${variant}${className ? ` ${className}` : ''}`}
      style={i > 0 ? { ...style, marginTop: gap } : style}
      aria-hidden="true"
    />
  ));

  if (count === 1) return elements[0];

  return (
    <div className="cl-skeleton-group" aria-busy="true" role="status">
      {elements}
      <span className="visually-hidden">Loading...</span>
    </div>
  );
};

export default SkeletonLoader;
