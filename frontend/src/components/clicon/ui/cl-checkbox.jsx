import React, { forwardRef } from 'react';

/**
 * Clicon styled checkbox.
 *
 * @param {Object} props
 * @param {string} [props.id]
 * @param {string} [props.label]
 * @param {boolean} [props.checked=false]
 * @param {function} [props.onChange]
 * @param {boolean} [props.disabled=false]
 * @param {number|string} [props.count] - Optional count badge (e.g., for filter sidebar)
 * @param {string} [props.className]
 */
const ClCheckbox = forwardRef(({
  id,
  label,
  checked = false,
  onChange,
  disabled = false,
  count,
  className = '',
  ...rest
}, ref) => {
  return (
    <label
      className={`cl-checkbox${disabled ? ' cl-checkbox--disabled' : ''}${className ? ` ${className}` : ''}`}
      htmlFor={id}
    >
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className="cl-checkbox__input"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      />
      <span className="cl-checkbox__check" aria-hidden="true" />
      {label && <span className="cl-checkbox__label">{label}</span>}
      {typeof count !== 'undefined' && (
        <span className="cl-checkbox__count">({count})</span>
      )}
    </label>
  );
});

ClCheckbox.displayName = 'ClCheckbox';

export default ClCheckbox;
