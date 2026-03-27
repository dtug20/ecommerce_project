import React, { forwardRef } from 'react';

/**
 * Clicon styled radio button.
 *
 * @param {Object} props
 * @param {string} [props.id]
 * @param {string} props.name - Radio group name
 * @param {string} props.value
 * @param {string} [props.label]
 * @param {boolean} [props.checked=false]
 * @param {function} [props.onChange]
 * @param {boolean} [props.disabled=false]
 * @param {React.ReactNode} [props.description] - Secondary text below label
 * @param {string} [props.className]
 */
const ClRadioButton = forwardRef(({
  id,
  name,
  value,
  label,
  checked = false,
  onChange,
  disabled = false,
  description,
  className = '',
  ...rest
}, ref) => {
  return (
    <label
      className={`cl-radio${checked ? ' cl-radio--checked' : ''}${disabled ? ' cl-radio--disabled' : ''}${className ? ` ${className}` : ''}`}
      htmlFor={id}
    >
      <input
        ref={ref}
        id={id}
        type="radio"
        className="cl-radio__input"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      />
      <span className="cl-radio__circle" aria-hidden="true" />
      <span className="cl-radio__content">
        {label && <span className="cl-radio__label">{label}</span>}
        {description && <span className="cl-radio__desc">{description}</span>}
      </span>
    </label>
  );
});

ClRadioButton.displayName = 'ClRadioButton';

export default ClRadioButton;
