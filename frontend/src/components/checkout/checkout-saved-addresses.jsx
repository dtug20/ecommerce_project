import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import keycloak from '@/lib/keycloak';
import { useGetAddressesQuery } from '@/redux/features/cmsApi';

const CheckoutSavedAddresses = ({ setValue, onAddressSelected }) => {
  const { t } = useTranslation();
  const isAuthenticated = keycloak.authenticated;
  const { data, isLoading } = useGetAddressesQuery(undefined, { skip: !isAuthenticated });
  const [selectedId, setSelectedId] = useState(null);
  const [showManual, setShowManual] = useState(false);

  const raw = data?.data ?? data?.addresses ?? data;
  const addresses = Array.isArray(raw) ? raw : [];

  useEffect(() => {
    if (addresses.length > 0 && !selectedId) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      handleSelect(defaultAddr);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses.length]);

  const handleSelect = (addr) => {
    setSelectedId(addr._id);
    setShowManual(false);

    // Prefer the explicit lastName field when present. Otherwise split fullName
    // on whitespace; if the name is a single token (common for Vietnamese
    // first-name-only entries like "Tài"), keep the whole thing as firstName
    // and leave lastName empty — the form must not block these users.
    const explicitLast = (addr.lastName || '').trim();
    const fullName = (addr.fullName || '').trim();
    let firstName = fullName;
    let lastName = explicitLast;
    if (!explicitLast && fullName.includes(' ')) {
      const parts = fullName.split(/\s+/);
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    }

    setValue('firstName', firstName, { shouldValidate: true });
    setValue('lastName', lastName, { shouldValidate: true });
    setValue('companyName', addr.company || '', { shouldValidate: true });
    setValue('address', addr.address || '', { shouldValidate: true });
    setValue('city', addr.city || '', { shouldValidate: true });
    setValue('state', addr.state || '', { shouldValidate: true });
    setValue('zipCode', addr.zipCode || '', { shouldValidate: true });
    setValue('country', addr.country || '', { shouldValidate: true });
    setValue('contactNo', addr.phone || '', { shouldValidate: true });
    if (addr.email) setValue('email', addr.email, { shouldValidate: true });
    if (onAddressSelected) onAddressSelected(addr);
  };

  const handleManual = () => {
    setSelectedId(null);
    setShowManual(true);
    setValue('firstName', '');
    setValue('lastName', '');
    setValue('companyName', '');
    setValue('address', '');
    setValue('city', '');
    setValue('state', '');
    setValue('zipCode', '');
    setValue('country', '');
    setValue('contactNo', '');
    if (onAddressSelected) onAddressSelected(null);
  };

  if (!isAuthenticated || isLoading || addresses.length === 0) return null;

  return (
    <div className="cl-checkout__addresses">
      <p className="cl-checkout__addresses-title">{t('checkout.savedAddresses')}</p>
      <div className="row g-2">
        {addresses.map((addr) => (
          <div key={addr._id} className="col-md-6 mb-2">
            <div
              onClick={() => handleSelect(addr)}
              className={`cl-checkout__address-card${selectedId === addr._id ? ' cl-checkout__address-card--selected' : ''}`}
            >
              <div className="cl-checkout__address-header">
                <div className="badges">
                  {addr.label && (
                    <span className="cl-checkout__address-badge cl-checkout__address-badge--label">
                      {addr.label}
                    </span>
                  )}
                  {addr.isDefault && (
                    <span className="cl-checkout__address-badge cl-checkout__address-badge--default">
                      {t('checkout.addressDefault')}
                    </span>
                  )}
                </div>
                <input
                  type="radio"
                  name="savedAddress"
                  checked={selectedId === addr._id}
                  onChange={() => handleSelect(addr)}
                />
              </div>
              <p className="cl-checkout__address-name">{addr.fullName}</p>
              <p className="cl-checkout__address-detail">
                {addr.address}, {addr.city}
                {addr.country ? `, ${addr.country}` : ''}
              </p>
              {addr.phone && (
                <p className="cl-checkout__address-detail">{addr.phone}</p>
              )}
            </div>
          </div>
        ))}
        <div className="col-12 mt-1">
          <button type="button" onClick={handleManual} className="cl-checkout__address-link">
            {t('checkout.useDifferentAddress')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSavedAddresses;
