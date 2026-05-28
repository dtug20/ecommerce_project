import React from "react";
import { useTranslation } from "react-i18next";
import ErrorMsg from "../common/error-msg";
import { useSelector } from "react-redux";

const CheckoutBillingArea = ({ register, errors }) => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="cl-checkout__card">
      <h3 className="cl-checkout__section-title">{t("checkout.billingInfo")}</h3>

      {/* Row 1: First Name, Last Name, Company Name */}
      <div className="cl-checkout__form-row">
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">
            {t("checkout.userName")} <span className="required">*</span>
          </label>
          <input
            {...register("firstName", { required: "First name is required!" })}
            name="firstName"
            id="firstName"
            type="text"
            className="cl-checkout__input"
            placeholder={t("checkout.firstNamePlaceholder")}
            defaultValue={user?.firstName}
          />
          <ErrorMsg msg={errors?.firstName?.message} />
        </div>
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">&nbsp;</label>
          <input
            {...register("lastName", { required: false })}
            name="lastName"
            id="lastName"
            type="text"
            className="cl-checkout__input"
            placeholder={t("checkout.lastNamePlaceholder")}
          />
          <ErrorMsg msg={errors?.lastName?.message} />
        </div>
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">
            {t("checkout.companyName")} <span className="optional">{t("checkout.optionalSuffix")}</span>
          </label>
          <input
            {...register("companyName", { required: false })}
            name="companyName"
            id="companyName"
            type="text"
            className="cl-checkout__input"
            placeholder=""
          />
        </div>
      </div>

      {/* Row 2: Address */}
      <div className="cl-checkout__form-row">
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">
            {t("checkout.address")} <span className="required">*</span>
          </label>
          <input
            {...register("address", { required: "Address is required!" })}
            name="address"
            id="address"
            type="text"
            className="cl-checkout__input"
            placeholder={t("checkout.addressPlaceholder")}
          />
          <ErrorMsg msg={errors?.address?.message} />
        </div>
      </div>

      {/* Row 3: Country, Region/State, City, Zip Code */}
      <div className="cl-checkout__form-row">
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">
            {t("checkout.country")} <span className="required">*</span>
          </label>
          <input
            {...register("country", { required: "Country is required!" })}
            name="country"
            id="country"
            type="text"
            className="cl-checkout__input"
            placeholder={t("checkout.selectPlaceholder")}
          />
          <ErrorMsg msg={errors?.country?.message} />
        </div>
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">{t("checkout.regionState")}</label>
          <input
            {...register("state", { required: false })}
            name="state"
            id="state"
            type="text"
            className="cl-checkout__input"
            placeholder={t("checkout.selectPlaceholder")}
          />
        </div>
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">
            {t("checkout.city")} <span className="required">*</span>
          </label>
          <input
            {...register("city", { required: "City is required!" })}
            name="city"
            id="city"
            type="text"
            className="cl-checkout__input"
            placeholder={t("checkout.selectPlaceholder")}
          />
          <ErrorMsg msg={errors?.city?.message} />
        </div>
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">
            {t("checkout.zipCode")} <span className="required">*</span>
          </label>
          <input
            {...register("zipCode", { required: "Zip code is required!" })}
            name="zipCode"
            id="zipCode"
            type="text"
            className="cl-checkout__input"
            placeholder=""
          />
          <ErrorMsg msg={errors?.zipCode?.message} />
        </div>
      </div>

      {/* Row 4: Email, Phone */}
      <div className="cl-checkout__form-row">
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">
            {t("checkout.email")} <span className="required">*</span>
          </label>
          <input
            {...register("email", { required: "Email is required!" })}
            name="email"
            id="email"
            type="email"
            className="cl-checkout__input"
            placeholder={t("checkout.emailPlaceholder")}
            defaultValue={user?.email}
          />
          <ErrorMsg msg={errors?.email?.message} />
        </div>
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">
            {t("checkout.phone")} <span className="required">*</span>
          </label>
          <input
            {...register("contactNo", { required: "Phone number is required!" })}
            name="contactNo"
            id="contactNo"
            type="text"
            className="cl-checkout__input"
            placeholder={t("checkout.phonePlaceholder")}
          />
          <ErrorMsg msg={errors?.contactNo?.message} />
        </div>
      </div>

      {/* Ship to different address checkbox */}
      <label className="cl-checkout__checkbox">
        <input type="checkbox" />
        {t("checkout.shipDifferentAddress")}
      </label>
    </div>
  );
};

export default CheckoutBillingArea;
