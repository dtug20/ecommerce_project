import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClTag } from '@/components/clicon/ui';

/**
 * Address card for profile and checkout.
 *
 * @param {Object} props
 * @param {Object} props.address - { _id, label, firstName, lastName, address, city, state, zipCode, country, phone, isDefault }
 * @param {boolean} [props.selected=false] - Highlight as selected
 * @param {function} [props.onSelect] - Called when card is clicked/selected
 * @param {function} [props.onEdit] - Edit callback
 * @param {function} [props.onDelete] - Delete callback
 * @param {boolean} [props.showActions=true] - Show edit/delete buttons
 * @param {string} [props.className]
 */
const AddressCard = ({
  address,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  showActions = true,
  className = '',
}) => {
  const { t } = useTranslation();

  if (!address) return null;

  const { label, firstName, lastName, address: street, city, state, zipCode, country, phone, isDefault } = address;
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const addressLine = [street, city, state, zipCode, country].filter(Boolean).join(', ');

  return (
    <div
      className={`cl-address-card${selected ? ' cl-address-card--selected' : ''}${onSelect ? ' cl-address-card--selectable' : ''}${className ? ` ${className}` : ''}`}
      onClick={onSelect}
      role={onSelect ? 'radio' : undefined}
      aria-checked={onSelect ? selected : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } } : undefined}
    >
      <div className="cl-address-card__header">
        <div className="cl-address-card__tags">
          {label && <ClTag label={label} variant="primary" />}
          {isDefault && <ClTag label={t('common.default', 'Default')} variant="success" />}
        </div>
        {showActions && (
          <div className="cl-address-card__actions">
            {onEdit && (
              <button
                type="button"
                className="cl-address-card__action"
                onClick={(e) => { e.stopPropagation(); onEdit(address); }}
                aria-label={t('common.edit', 'Edit')}
              >
                <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
              </button>
            )}
            {onDelete && !isDefault && (
              <button
                type="button"
                className="cl-address-card__action cl-address-card__action--danger"
                onClick={(e) => { e.stopPropagation(); onDelete(address); }}
                aria-label={t('common.delete', 'Delete')}
              >
                <i className="fa-regular fa-trash-can" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="cl-address-card__body">
        <p className="cl-address-card__name">{fullName}</p>
        <p className="cl-address-card__address">{addressLine}</p>
        {phone && <p className="cl-address-card__phone">{phone}</p>}
      </div>
    </div>
  );
};

export default AddressCard;
