import React, { forwardRef } from 'react';

/**
 * Clicon design system button.
 *
 * @param {Object} props
 * @param {'primary'|'outlined'|'ghost'|'danger'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {React.ReactNode} [props.leftIcon] - Icon before text
 * @param {React.ReactNode} [props.rightIcon] - Icon after text
 * @param {boolean} [props.fullWidth=false]
 * @param {boolean} [props.loading=false]
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
const ClButton = forwardRef(({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}, ref) => {
  const classes = [
    'cl-btn',
    `cl-btn--${variant}`,
    `cl-btn--${size}`,
    fullWidth && 'cl-btn--full',
    loading && 'cl-btn--loading',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="cl-btn__spinner" aria-hidden="true" />
      )}
      {!loading && leftIcon && (
        <span className="cl-btn__icon cl-btn__icon--left">{leftIcon}</span>
      )}
      {!loading && <span className="cl-btn__text">{children}</span>}
      {!loading && rightIcon && (
        <span className="cl-btn__icon cl-btn__icon--right">{rightIcon}</span>
      )}
    </button>
  );
});

ClButton.displayName = 'ClButton';

export default ClButton;
