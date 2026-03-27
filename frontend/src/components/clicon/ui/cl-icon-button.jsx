import React, { forwardRef } from 'react';

/**
 * Icon-only button for actions like wishlist, compare, quick view.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon element (e.g., <i className="..." />)
 * @param {'sm'|'md'|'lg'} [props.size='md'] - sm=32px, md=40px, lg=48px
 * @param {'circle'|'square'} [props.shape='circle']
 * @param {'default'|'primary'|'outlined'} [props.variant='default']
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.ariaLabel] - Required for accessibility
 * @param {string} [props.className]
 */
const ClIconButton = forwardRef(({
  icon,
  size = 'md',
  shape = 'circle',
  variant = 'default',
  disabled = false,
  ariaLabel,
  className = '',
  ...rest
}, ref) => {
  const classes = [
    'cl-icon-btn',
    `cl-icon-btn--${size}`,
    `cl-icon-btn--${shape}`,
    `cl-icon-btn--${variant}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      type="button"
      className={classes}
      disabled={disabled}
      aria-label={ariaLabel}
      {...rest}
    >
      {icon}
    </button>
  );
});

ClIconButton.displayName = 'ClIconButton';

export default ClIconButton;
