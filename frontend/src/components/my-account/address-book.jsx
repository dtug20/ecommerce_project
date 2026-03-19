import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} from '@/redux/features/cmsApi';
import { notifySuccess, notifyError } from '@/utils/toast';
import ErrorMsg from '@/components/common/error-msg';

const EMPTY_ADDRESS = {
  label: '',
  fullName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  isDefault: false,
};

const AddressForm = ({ initial = EMPTY_ADDRESS, onSave, onCancel, isLoading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initial,
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="tp-checkout-bill-form">
      <div className="tp-checkout-bill-inner">
        <div className="row">
          <div className="col-md-6">
            <div className="tp-checkout-input">
              <label>Label (e.g. Home, Work)</label>
              <input
                {...register('label')}
                type="text"
                placeholder="Home"
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="tp-checkout-input">
              <label>Full Name <span>*</span></label>
              <input
                {...register('fullName', { required: 'Full name is required' })}
                type="text"
                placeholder="John Doe"
              />
              <ErrorMsg msg={errors?.fullName?.message} />
            </div>
          </div>
          <div className="col-md-12">
            <div className="tp-checkout-input">
              <label>Phone <span>*</span></label>
              <input
                {...register('phone', { required: 'Phone is required' })}
                type="text"
                placeholder="+1 234 567 8900"
              />
              <ErrorMsg msg={errors?.phone?.message} />
            </div>
          </div>
          <div className="col-md-12">
            <div className="tp-checkout-input">
              <label>Address <span>*</span></label>
              <input
                {...register('address', { required: 'Address is required' })}
                type="text"
                placeholder="House number and street name"
              />
              <ErrorMsg msg={errors?.address?.message} />
            </div>
          </div>
          <div className="col-md-6">
            <div className="tp-checkout-input">
              <label>City <span>*</span></label>
              <input
                {...register('city', { required: 'City is required' })}
                type="text"
                placeholder="City"
              />
              <ErrorMsg msg={errors?.city?.message} />
            </div>
          </div>
          <div className="col-md-6">
            <div className="tp-checkout-input">
              <label>State / Province</label>
              <input
                {...register('state')}
                type="text"
                placeholder="State"
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="tp-checkout-input">
              <label>ZIP Code</label>
              <input
                {...register('zipCode')}
                type="text"
                placeholder="12345"
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="tp-checkout-input">
              <label>Country <span>*</span></label>
              <input
                {...register('country', { required: 'Country is required' })}
                type="text"
                placeholder="United States"
              />
              <ErrorMsg msg={errors?.country?.message} />
            </div>
          </div>
          <div className="col-md-12">
            <div className="tp-checkout-input d-flex align-items-center gap-2">
              <input
                {...register('isDefault')}
                type="checkbox"
                id="isDefault"
                style={{ width: 'auto' }}
              />
              <label htmlFor="isDefault" style={{ marginBottom: 0 }}>
                Set as default address
              </label>
            </div>
          </div>
        </div>
        <div className="d-flex gap-3 mt-20">
          <button
            type="submit"
            disabled={isLoading}
            className="tp-btn tp-color-btn banner-animation"
          >
            {isLoading ? 'Saving...' : 'Save Address'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="tp-btn"
            style={{ backgroundColor: '#f5f5f5', color: '#333' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

const AddressBook = () => {
  const { data, isLoading, isError } = useGetAddressesQuery();
  const [addAddress, { isLoading: isAdding }] = useAddAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const addresses = data?.addresses || data || [];

  const handleAdd = async (formData) => {
    try {
      await addAddress(formData).unwrap();
      notifySuccess('Address added successfully');
      setShowAddForm(false);
    } catch {
      notifyError('Failed to add address');
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await updateAddress({ id: editingAddress._id, ...formData }).unwrap();
      notifySuccess('Address updated successfully');
      setEditingAddress(null);
    } catch {
      notifyError('Failed to update address');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    setDeletingId(id);
    try {
      await deleteAddress(id).unwrap();
      notifySuccess('Address deleted');
    } catch {
      notifyError('Failed to delete address');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id).unwrap();
      notifySuccess('Default address updated');
    } catch {
      notifyError('Failed to set default address');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="alert alert-warning">
        Unable to load addresses. Please try again later.
      </div>
    );
  }

  return (
    <div className="profile__address-book">
      <div className="d-flex justify-content-between align-items-center mb-20">
        <h4 className="mb-0">Saved Addresses</h4>
        {!showAddForm && !editingAddress && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="tp-btn tp-color-btn banner-animation"
          >
            + Add New Address
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="card p-3 mb-20" style={{ border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <h5 className="mb-15">New Address</h5>
          <AddressForm
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
            isLoading={isAdding}
          />
        </div>
      )}

      {/* Empty state */}
      {!showAddForm && addresses.length === 0 && (
        <div className="text-center py-4 text-muted">
          <p>You have no saved addresses yet.</p>
        </div>
      )}

      {/* Address cards */}
      <div className="row">
        {addresses.map((addr) => (
          <div key={addr._id} className="col-md-6 mb-20">
            {editingAddress?._id === addr._id ? (
              <div className="card p-3" style={{ border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                <h5 className="mb-15">Edit Address</h5>
                <AddressForm
                  initial={addr}
                  onSave={handleUpdate}
                  onCancel={() => setEditingAddress(null)}
                  isLoading={isUpdating}
                />
              </div>
            ) : (
              <div
                className="card p-3 h-100"
                style={{
                  border: addr.isDefault ? '2px solid #821F40' : '1px solid #e0e0e0',
                  borderRadius: '8px',
                  position: 'relative',
                }}
              >
                {/* Label badges */}
                <div className="d-flex gap-2 mb-10">
                  {addr.label && (
                    <span className="badge" style={{ backgroundColor: '#821F40' }}>
                      {addr.label}
                    </span>
                  )}
                  {addr.isDefault && (
                    <span className="badge bg-success">Default</span>
                  )}
                </div>

                {/* Address details */}
                <p className="mb-5 fw-bold">{addr.fullName}</p>
                {addr.phone && <p className="mb-5 text-muted">{addr.phone}</p>}
                <p className="mb-5">{addr.address}</p>
                <p className="mb-5">
                  {[addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ')}
                </p>
                <p className="mb-15">{addr.country}</p>

                {/* Actions */}
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setEditingAddress(addr)}
                    className="tp-btn tp-btn-2"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Edit
                  </button>
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr._id)}
                      className="tp-btn tp-btn-2"
                      style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#f5f5f5', color: '#333' }}
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(addr._id)}
                    disabled={deletingId === addr._id}
                    className="tp-btn tp-btn-2"
                    style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#fff0f0', color: '#d00' }}
                  >
                    {deletingId === addr._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddressBook;
