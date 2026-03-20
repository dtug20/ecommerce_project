import React, { useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
// internal
import { notifyError, notifySuccess } from '@/utils/toast';
import { useApplyForVendorMutation } from '@/redux/features/cmsApi';
import { useGetUserProfileQuery } from '@/redux/features/auth/authApi';

/**
 * VendorApplication — tab panel in the user profile page.
 * Handles four states:
 *  1. Already a vendor       → show confirmation + link to vendor dashboard
 *  2. Application pending    → show pending notice
 *  3. Application rejected   → show rejection notice + re-apply form
 *  4. No application yet     → show application form
 */
const VendorApplication = () => {
  const { user } = useSelector((state) => state.auth);

  // Fetch full profile so we have vendorProfile populated from MongoDB
  const { data: profileData } = useGetUserProfileQuery(undefined, {
    skip: !user,
  });

  const fullUser = profileData?.data?.user || profileData || user;
  const verificationStatus = fullUser?.vendorProfile?.verificationStatus;
  const isVendor = fullUser?.role === 'vendor';
  const storeSlug = fullUser?.vendorProfile?.storeSlug;

  const [applyForVendor, { isLoading: submitting }] = useApplyForVendorMutation();

  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!storeName.trim()) {
      notifyError('Store name is required.');
      return;
    }

    try {
      await applyForVendor({
        storeName: storeName.trim(),
        storeDescription: storeDescription.trim(),
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
      }).unwrap();

      notifySuccess('Your vendor application has been submitted! We will review it shortly.');
      setStoreName('');
      setStoreDescription('');
      setBankName('');
      setBankAccount('');
    } catch (err) {
      notifyError(err?.data?.message || 'Failed to submit application. Please try again.');
    }
  };

  // --- State 1: already a vendor ---
  if (isVendor) {
    return (
      <div className="profile__info">
        <h3 className="profile__info-title">Vendor Account</h3>
        <div className="alert alert-success" role="alert">
          <strong>You are a verified vendor!</strong>
          <p className="mb-2 mt-1">
            You can manage your products, orders, and payouts from the vendor dashboard.
          </p>
          {storeSlug && (
            <Link href={`/vendor/${storeSlug}`} className="tp-btn tp-btn-sm me-2">
              View My Store
            </Link>
          )}
          <a
            href={`${process.env.NEXT_PUBLIC_VENDOR_DASHBOARD_URL || '/vendor/dashboard'}`}
            className="tp-btn tp-btn-sm tp-btn-border"
          >
            Vendor Dashboard
          </a>
        </div>
      </div>
    );
  }

  // --- State 2: application pending ---
  if (verificationStatus === 'pending') {
    return (
      <div className="profile__info">
        <h3 className="profile__info-title">Become a Vendor</h3>
        <div className="alert alert-warning" role="alert">
          <strong>Application under review</strong>
          <p className="mb-0 mt-1">
            Your vendor application has been submitted and is currently being reviewed by our team.
            We will notify you by email once a decision has been made. This typically takes 1–3
            business days.
          </p>
        </div>
      </div>
    );
  }

  // --- State 3: application rejected — show notice + re-apply form ---
  const rejectionReason = fullUser?.vendorProfile?.rejectionReason;

  return (
    <div className="profile__info">
      <h3 className="profile__info-title">Become a Vendor</h3>

      {verificationStatus === 'rejected' && (
        <div className="alert alert-danger mb-30" role="alert">
          <strong>Application not approved</strong>
          {rejectionReason && (
            <p className="mb-0 mt-1">
              <strong>Reason:</strong> {rejectionReason}
            </p>
          )}
          <p className="mb-0 mt-1">
            You may update your details below and re-submit your application.
          </p>
        </div>
      )}

      <p className="mb-25" style={{ color: '#555', fontSize: '14px' }}>
        Sell your products on Shofy Marketplace. Fill in the form below to apply for a vendor
        account. Our team will review your application within 1–3 business days.
      </p>

      {/* --- Application form --- */}
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label tp-form-label" htmlFor="vendor-store-name">
                Store Name <span className="text-danger">*</span>
              </label>
              <input
                id="vendor-store-name"
                type="text"
                className="form-control tp-form-control"
                placeholder="e.g. My Awesome Store"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                maxLength={80}
              />
            </div>
          </div>

          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label tp-form-label" htmlFor="vendor-bank-name">
                Bank Account Name
              </label>
              <input
                id="vendor-bank-name"
                type="text"
                className="form-control tp-form-control"
                placeholder="Name on bank account"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                maxLength={100}
              />
            </div>
          </div>

          <div className="col-12">
            <div className="mb-3">
              <label className="form-label tp-form-label" htmlFor="vendor-store-description">
                Store Description
              </label>
              <textarea
                id="vendor-store-description"
                className="form-control tp-form-control"
                rows={4}
                placeholder="Tell us about your store and the products you sell..."
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>

          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label tp-form-label" htmlFor="vendor-bank-account">
                Bank Account Number
              </label>
              <input
                id="vendor-bank-account"
                type="text"
                className="form-control tp-form-control"
                placeholder="e.g. 123456789"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                maxLength={50}
              />
            </div>
          </div>
        </div>

        <div className="profile__btn mt-10">
          <button
            type="submit"
            className="tp-btn"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Apply to Become a Vendor'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorApplication;
