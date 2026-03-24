import React, { useState, useEffect } from 'react';
import keycloak from '@/lib/keycloak';
import { useGetAddressesQuery } from '@/redux/features/cmsApi';

const CheckoutSavedAddresses = ({ setValue, onAddressSelected }) => {
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
    const nameParts = (addr.fullName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    setValue('firstName', firstName);
    setValue('lastName', lastName);
    setValue('address', addr.address || '');
    setValue('city', addr.city || '');
    setValue('zipCode', addr.zipCode || '');
    setValue('country', addr.country || '');
    setValue('contactNo', addr.phone || '');
    if (onAddressSelected) onAddressSelected(addr);
  };

  const handleManual = () => {
    setSelectedId(null);
    setShowManual(true);
    setValue('firstName', '');
    setValue('lastName', '');
    setValue('address', '');
    setValue('city', '');
    setValue('zipCode', '');
    setValue('country', '');
    setValue('contactNo', '');
    if (onAddressSelected) onAddressSelected(null);
  };

  if (!isAuthenticated || isLoading || addresses.length === 0) return null;

  return (
    <div className="cl-checkout__addresses">
      <p className="cl-checkout__addresses-title">Saved Addresses</p>
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
                      Default
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
            + Use a different address
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSavedAddresses;
