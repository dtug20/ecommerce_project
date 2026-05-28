import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { useUpdateProfileMutation } from "@/redux/features/auth/authApi";
import {
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
} from "@/redux/features/cmsApi";
import { useKeycloak } from "@/components/providers/keycloak-provider";
import { notifySuccess, notifyError } from "@/utils/toast";

// ── Account Info Form ────────────────────────────────────────────────
const AccountInfoForm = ({ user }) => {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });
  const [updateProfile] = useUpdateProfileMutation();

  useEffect(() => {
    reset({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
  }, [user, reset]);

  const onSubmit = async (data) => {
    try {
      await updateProfile(data).unwrap();
      notifySuccess(t("profile.accountUpdated"));
    } catch {
      notifyError(t("profile.failedUpdate"));
    }
  };

  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="cl-setting-avatar">
        <div className="cl-setting-avatar__circle">{avatarLetter}</div>
        <div className="cl-setting-avatar__meta">
          <strong>{user?.name || "User"}</strong>
          <span>{user?.email || ""}</span>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="cl-setting-field">
            <label>{t("profile.fullName")}</label>
            <input {...register("name")} placeholder={t("profile.fullName")} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="cl-setting-field">
            <label>{t("profile.emailAddress")}</label>
            <input {...register("email")} type="email" placeholder={t("profile.emailAddress")} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="cl-setting-field">
            <label>{t("profile.phoneNumber")}</label>
            <input {...register("phone")} placeholder="+1-000-000-0000" />
          </div>
        </div>
      </div>

      <button type="submit" className="cl-setting-save-btn" disabled={isSubmitting}>
        {isSubmitting ? t("profile.saving") : t("profile.saveChanges")}
      </button>
    </form>
  );
};

// ── Address Form ─────────────────────────────────────────────────────
// `slot` = "billing" | "shipping" — persisted as the address `label`.
// Only the billing slot claims isDefault on creation.
const AddressForm = ({ title, existing, slot }) => {
  const { t } = useTranslation();
  const buildDefaults = (a) => ({
    fullName: a?.fullName || "",
    lastName: a?.lastName || "",
    company: a?.company || "",
    phone: a?.phone || "",
    address: a?.address || "",
    city: a?.city || "",
    state: a?.state || "",
    zipCode: a?.zipCode || "",
    country: a?.country || "",
    email: a?.email || "",
  });
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: existing ? buildDefaults(existing) : buildDefaults(null),
  });

  const [addAddress] = useAddAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();

  useEffect(() => {
    reset(buildDefaults(existing));
  }, [existing, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, label: slot };
      if (existing?._id) {
        await updateAddress({ id: existing._id, ...payload }).unwrap();
      } else {
        // Only billing becomes the default; shipping must not flip it.
        await addAddress({ ...payload, isDefault: slot === "billing" }).unwrap();
      }
      notifySuccess(`${title} saved!`);
    } catch {
      notifyError(t("profile.failedAddress"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="row g-3">
        <div className="col-md-6">
          <div className="cl-setting-field">
            <label>{t("profile.firstName")}</label>
            <input {...register("fullName")} placeholder={t("profile.firstName")} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="cl-setting-field">
            <label>{t("profile.lastName")}</label>
            <input {...register("lastName")} placeholder={t("profile.lastName")} />
          </div>
        </div>
        <div className="col-12">
          <div className="cl-setting-field">
            <label className="optional">{t("profile.companyName")} <span>({t("profile.optional")})</span></label>
            <input {...register("company")} placeholder={t("profile.companyName")} />
          </div>
        </div>
        <div className="col-12">
          <div className="cl-setting-field">
            <label>{t("checkout.address")}</label>
            <input {...register("address")} placeholder={t("checkout.address")} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="cl-setting-field">
            <label>{t("checkout.country")}</label>
            <input {...register("country")} placeholder={t("checkout.country")} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="cl-setting-field">
            <label>{t("checkout.state")}</label>
            <input {...register("state")} placeholder={t("checkout.state")} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="cl-setting-field">
            <label>{t("checkout.city")}</label>
            <input {...register("city")} placeholder={t("checkout.city")} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="cl-setting-field">
            <label>{t("checkout.zipCode")}</label>
            <input {...register("zipCode")} placeholder={t("checkout.zipCode")} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="cl-setting-field">
            <label>{t("profile.emailAddress")}</label>
            <input {...register("email")} type="email" placeholder={t("profile.emailAddress")} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="cl-setting-field">
            <label>{t("profile.phoneNumber")}</label>
            <input {...register("phone")} placeholder="+1-000-000-0000" />
          </div>
        </div>
      </div>

      <button type="submit" className="cl-setting-save-btn" disabled={isSubmitting}>
        {isSubmitting ? t("profile.saving") : t("profile.saveChanges")}
      </button>
    </form>
  );
};

// ── Main Component ───────────────────────────────────────────────────
const AccountSetting = () => {
  const { user } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const keycloak = useKeycloak();
  const { data: addressData } = useGetAddressesQuery(undefined, { skip: !user });

  const addresses = addressData?.data || [];
  // Find by label so billing/shipping bind to their own document,
  // not to whatever happens to sit at addresses[0] / addresses[1].
  const billingAddress =
    addresses.find((a) => a.label === "billing") ||
    addresses.find((a) => a.isDefault) ||
    null;
  const shippingAddress =
    addresses.find((a) => a.label === "shipping") || null;

  const handleChangePassword = () => {
    if (keycloak?.authServerUrl && keycloak?.realm) {
      window.open(
        `${keycloak.authServerUrl}/realms/${keycloak.realm}/account/#/security/signingin`,
        "_blank"
      );
    }
  };

  return (
    <>
      {/* Account Setting */}
      <div className="cl-setting-section">
        <div className="cl-setting-section__title">{t("profile.accountSetting")}</div>
        <AccountInfoForm user={user} />
        <div style={{ marginTop: 20 }}>
          <button type="button" className="cl-setting-keycloak-btn" onClick={handleChangePassword}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            {t("profile.changePassword")}
          </button>
        </div>
      </div>

      {/* Billing Address */}
      <div className="cl-setting-section">
        <div className="cl-setting-section__title">{t("profile.billingAddress")}</div>
        <AddressForm
          title={t("profile.billingAddress")}
          existing={billingAddress}
          slot="billing"
        />
      </div>

      {/* Shipping Address */}
      <div className="cl-setting-section">
        <div className="cl-setting-section__title">{t("trackOrder.shippingAddress")}</div>
        <AddressForm
          title={t("trackOrder.shippingAddress")}
          existing={shippingAddress}
          slot="shipping"
        />
      </div>
    </>
  );
};

export default AccountSetting;
