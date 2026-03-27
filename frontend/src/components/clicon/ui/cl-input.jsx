import React, { forwardRef } from 'react';

/**
 * Clicon design system input field.
 *
 * @param {Object} props
 * @param {'text'|'password'|'email'|'number'|'search'|'tel'|'url'} [props.type='text']
 * @param {string} [props.label]
 * @param {string} [props.placeholder]
 * @param {string} [props.error] - Error message (shows red border + message)
 * @param {string} [props.helperText] - Helper text below input
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.id] - Input id (auto-linked to label)
 * @param {string} [props.className] - Wrapper className
 */
const ClInput = forwardRef(({
  type = 'text',
  label,
  placeholder,
  error,
  helperText,
  leftIcon,
  rightIcon,
  disabled = false,
  id,
  className = '',
  ...rest
}, ref) => {
  const wrapperClasses = [
    'cl-input',
    error && 'cl-input--error',
    disabled && 'cl-input--disabled',
    leftIcon && 'cl-input--has-left-icon',
    rightIcon && 'cl-input--has-right-icon',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={id} className="cl-input__label">
          {label}
        </label>
      )}
      <div className="cl-input__wrapper">
        {leftIcon && (
          <span className="cl-input__icon cl-input__icon--left" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          className="cl-input__field"
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...rest}
        />
        {rightIcon && (
          <span className="cl-input__icon cl-input__icon--right" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <span id={`${id}-error`} className="cl-input__error" role="alert">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={`${id}-helper`} className="cl-input__helper">
          {helperText}
        </span>
      )}
    </div>
  );
});

ClInput.displayName = 'ClInput';

export default ClInput;
