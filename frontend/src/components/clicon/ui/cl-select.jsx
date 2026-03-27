import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom dropdown select component.
 *
 * @param {Object} props
 * @param {{ value: string, label: string }[]} props.options
 * @param {string} [props.value] - Selected value
 * @param {function} [props.onChange] - Called with selected value
 * @param {string} [props.placeholder='Select...']
 * @param {string} [props.label]
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.className]
 */
const ClSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  label,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  const handleClickOutside = useCallback((e) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const handleSelect = (optValue) => {
    onChange?.(optValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setIsOpen(false);
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`cl-select${isOpen ? ' cl-select--open' : ''}${disabled ? ' cl-select--disabled' : ''}${className ? ` ${className}` : ''}`}
    >
      {label && <span className="cl-select__label">{label}</span>}
      <button
        type="button"
        className="cl-select__trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <span className={`cl-select__value${!selectedOption ? ' cl-select__value--placeholder' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <i className="fa-solid fa-chevron-down cl-select__arrow" aria-hidden="true" />
      </button>
      {isOpen && (
        <ul className="cl-select__dropdown" role="listbox">
          {options.map((opt) => (
            <li
              key={opt.value}
              className={`cl-select__option${opt.value === value ? ' cl-select__option--selected' : ''}`}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClSelect;
