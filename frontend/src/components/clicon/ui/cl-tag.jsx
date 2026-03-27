import React from 'react';

/**
 * Tag/chip component for labels, filters, blog tags.
 *
 * @param {Object} props
 * @param {string} props.label - Tag text
 * @param {'default'|'primary'|'success'|'warning'|'danger'} [props.variant='default']
 * @param {boolean} [props.removable=false]
 * @param {function} [props.onRemove] - Called when remove button clicked
 * @param {function} [props.onClick] - Makes tag clickable
 * @param {string} [props.className]
 */
const ClTag = ({ label, variant = 'default', removable = false, onRemove, onClick, className = '' }) => {
  const Tag = onClick ? 'button' : 'span';

  return (
    <Tag
      className={`cl-tag cl-tag--${variant}${onClick ? ' cl-tag--clickable' : ''}${className ? ` ${className}` : ''}`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <span className="cl-tag__label">{label}</span>
      {removable && (
        <button
          type="button"
          className="cl-tag__remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          aria-label={`Remove ${label}`}
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      )}
    </Tag>
  );
};

export default ClTag;
