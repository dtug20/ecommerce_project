import React from 'react';

/**
 * Progress bar with percentage or step-based display.
 *
 * @param {Object} props
 * @param {number} props.value - Current value (0–100)
 * @param {number} [props.max=100]
 * @param {'primary'|'success'|'warning'|'danger'} [props.variant='primary']
 * @param {'sm'|'md'} [props.size='md'] - sm=4px height, md=8px height
 * @param {boolean} [props.showLabel=false] - Show percentage text
 * @param {string} [props.className]
 */
const ClProgressBar = ({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={`cl-progress cl-progress--${size} cl-progress--${variant}${className ? ` ${className}` : ''}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="cl-progress__track">
        <div
          className="cl-progress__bar"
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="cl-progress__label">{Math.round(percent)}%</span>
      )}
    </div>
  );
};

export default ClProgressBar;
