import React from "react";
import ErrorMsg from "../common/error-msg";
import { useSelector } from "react-redux";

const CheckoutBillingArea = ({ register, errors }) => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="cl-checkout__card">
      <h3 className="cl-checkout__section-title">Billing Information</h3>

      {/* Row 1: First Name, Last Name, Company Name */}
      <div className="cl-checkout__form-row">
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">
            User name <span className="required">*</span>
          </label>
          <input
            {...register("firstName", { required: "First name is required!" })}
            name="firstName"
            id="firstName"
            type="text"
            className="cl-checkout__input"
            placeholder="First name"
            defaultValue={user?.firstName}
          />
          <ErrorMsg msg={errors?.firstName?.message} />
        </div>
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">&nbsp;</label>
          <input
            {...register("lastName", { required: "Last name is required!" })}
            name="lastName"
            id="lastName"
            type="text"
            className="cl-checkout__input"
            placeholder="Last name"
          />
          <ErrorMsg msg={errors?.lastName?.message} />
        </div>
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">
            Company Name <span className="optional">(Optional)</span>
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
            Address <span className="required">*</span>
          </label>
          <input
            {...register("address", { required: "Address is required!" })}
            name="address"
            id="address"
            type="text"
            className="cl-checkout__input"
            placeholder="House number and street name"
          />
          <ErrorMsg msg={errors?.address?.message} />
        </div>
      </div>

      {/* Row 3: Country, Region/State, City, Zip Code */}
      <div className="cl-checkout__form-row">
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">
            Country <span className="required">*</span>
          </label>
          <input
            {...register("country", { required: "Country is required!" })}
            name="country"
            id="country"
            type="text"
            className="cl-checkout__input"
            placeholder="Select..."
          />
          <ErrorMsg msg={errors?.country?.message} />
        </div>
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">Region/State</label>
          <input
            {...register("state", { required: false })}
            name="state"
            id="state"
            type="text"
            className="cl-checkout__input"
            placeholder="Select..."
          />
        </div>
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">
            City <span className="required">*</span>
          </label>
          <input
            {...register("city", { required: "City is required!" })}
            name="city"
            id="city"
            type="text"
            className="cl-checkout__input"
            placeholder="Select..."
          />
          <ErrorMsg msg={errors?.city?.message} />
        </div>
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">
            Zip Code <span className="required">*</span>
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
            Email <span className="required">*</span>
          </label>
          <input
            {...register("email", { required: "Email is required!" })}
            name="email"
            id="email"
            type="email"
            className="cl-checkout__input"
            placeholder="Email address"
            defaultValue={user?.email}
          />
          <ErrorMsg msg={errors?.email?.message} />
        </div>
        <div className="cl-checkout__form-group">
          <label className="cl-checkout__label">
            Phone Number <span className="required">*</span>
          </label>
          <input
            {...register("contactNo", { required: "Phone number is required!" })}
            name="contactNo"
            id="contactNo"
            type="text"
            className="cl-checkout__input"
            placeholder="Phone number"
          />
          <ErrorMsg msg={errors?.contactNo?.message} />
        </div>
      </div>

      {/* Ship to different address checkbox */}
      <label className="cl-checkout__checkbox">
        <input type="checkbox" />
        Ship into different address
      </label>
    </div>
  );
};

export default CheckoutBillingArea;
