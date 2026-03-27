import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Quantity selector with increment/decrement buttons.
 *
 * @param {Object} props
 * @param {number} props.value - Current quantity
 * @param {number} [props.min=1]
 * @param {number} [props.max=99]
 * @param {function} props.onChange - Called with new value
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.className]
 */
const QuantitySelector = forwardRef(({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
  className = '',
}, ref) => {
  const { t } = useTranslation();

  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  const handleInputChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      onChange(Math.min(max, Math.max(min, val)));
    }
  };

  return (
    <div
      ref={ref}
      className={`cl-quantity${disabled ? ' cl-quantity--disabled' : ''}${className ? ` ${className}` : ''}`}
    >
      <button
        type="button"
        className="cl-quantity__btn cl-quantity__btn--minus"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label={t('cart.decrease', 'Decrease quantity')}
      >
        <i className="fa-solid fa-minus" aria-hidden="true" />
      </button>
      <input
        type="number"
        className="cl-quantity__input"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        disabled={disabled}
        aria-label={t('cart.quantity', 'Quantity')}
      />
      <button
        type="button"
        className="cl-quantity__btn cl-quantity__btn--plus"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label={t('cart.increase', 'Increase quantity')}
      >
        <i className="fa-solid fa-plus" aria-hidden="true" />
      </button>
    </div>
  );
});

QuantitySelector.displayName = 'QuantitySelector';

export default QuantitySelector;
