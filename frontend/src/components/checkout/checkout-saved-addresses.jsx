import React, { useState, useEffect } from 'react';
import keycloak from '@/lib/keycloak';
import { useGetAddressesQuery } from '@/redux/features/cmsApi';

/**
 * Shows saved addresses above the billing form in checkout.
 * When a saved address is selected, it auto-fills the form via setValue.
 * The parent can also show/hide the manual form based on selection.
 */
const CheckoutSavedAddresses = ({ setValue, onAddressSelected }) => {
  const isAuthenticated = keycloak.authenticated;
  const { data, isLoading } = useGetAddressesQuery(undefined, { skip: !isAuthenticated });
  const [selectedId, setSelectedId] = useState(null);
  const [showManual, setShowManual] = useState(false);

  const raw = data?.data ?? data?.addresses ?? data;
  const addresses = Array.isArray(raw) ? raw : [];

  // Pre-select default address on load
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
    // Auto-fill form fields
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
    // Clear auto-filled fields
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
    <div className="tp-checkout-verify-item mb-20">
      <p className="tp-checkout-verify-reveal-btn">
        <span>Saved Addresses</span>
      </p>
      <div className="tp-checkout-coupon">
        <div className="row">
          {addresses.map((addr) => (
            <div key={addr._id} className="col-md-6 mb-10">
              <div
                onClick={() => handleSelect(addr)}
                style={{
                  padding: '12px',
                  border: selectedId === addr._id ? '2px solid #821F40' : '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: selectedId === addr._id ? '#fff5f7' : '#fff',
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-5">
                  <div className="d-flex gap-2">
                    {addr.label && (
                      <span className="badge" style={{ backgroundColor: '#821F40', fontSize: '10px' }}>
                        {addr.label}
                      </span>
                    )}
                    {addr.isDefault && (
                      <span className="badge bg-success" style={{ fontSize: '10px' }}>Default</span>
                    )}
                  </div>
                  <div>
                    <input
                      type="radio"
                      name="savedAddress"
                      checked={selectedId === addr._id}
                      onChange={() => handleSelect(addr)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                </div>
                <p className="mb-0 fw-bold" style={{ fontSize: '13px' }}>{addr.fullName}</p>
                <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
                  {addr.address}, {addr.city}
                  {addr.country ? `, ${addr.country}` : ''}
                </p>
                {addr.phone && (
                  <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>{addr.phone}</p>
                )}
              </div>
            </div>
          ))}

          <div className="col-12 mt-5">
            <button
              type="button"
              onClick={handleManual}
              style={{
                background: 'none',
                border: 'none',
                color: '#821F40',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
                fontSize: '13px',
              }}
            >
              + Use a different address
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSavedAddresses;
