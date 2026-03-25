import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useGetAddressesQuery } from "@/redux/features/cmsApi";

const ProfileDashboard = ({ orderData, setActiveTab }) => {
  const { user } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const { data: addressData } = useGetAddressesQuery(undefined, { skip: !user });

  const defaultAddress = addressData?.addresses?.find((a) => a.isDefault) || addressData?.addresses?.[0];

  const totalOrders = orderData?.totalDoc ?? 0;
  const pendingOrders = orderData?.pending ?? 0;
  const completedOrders = orderData?.delivered ?? 0;

  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      {/* Greeting */}
      <div className="cl-dash-greeting">
        <h4>{t("profile.hello", { name: user?.name || "User" })}</h4>
        <p>
          {t("profile.dashboardDesc", {
            recentOrders: t("profile.recentOrders"),
            shippingAddresses: t("profile.shippingBillingAddresses"),
          })}
        </p>
      </div>

      {/* Info cards row */}
      <div className="cl-dash-info-cards">
        {/* Account Info */}
        <div className="cl-dash-info-card">
          <div className="cl-dash-info-card__title">{t("profile.accountInfo")}</div>
          <div className="cl-dash-info-card__body">
            <div className="cl-dash-info-card__avatar">{avatarLetter}</div>
            <div className="cl-dash-info-card__meta">
              <strong>{user?.name || "—"}</strong>
              {user?.email && <span>{user.email}</span>}
              {user?.phone && <span>{user.phone}</span>}
            </div>
          </div>
          <button
            type="button"
            className="cl-dash-info-card__btn"
            onClick={() => setActiveTab("setting")}
          >
            {t("profile.editAccount")}
          </button>
        </div>

        {/* Billing Address */}
        <div className="cl-dash-info-card">
          <div className="cl-dash-info-card__title">{t("profile.billingAddress")}</div>
          <div className="cl-dash-info-card__body">
            <div className="cl-dash-info-card__meta">
              {defaultAddress ? (
                <>
                  <strong>{defaultAddress.fullName}</strong>
                  <span>{defaultAddress.address}</span>
                  {defaultAddress.city && <span>{defaultAddress.city}{defaultAddress.country ? `, ${defaultAddress.country}` : ""}</span>}
                  {defaultAddress.phone && <span>{defaultAddress.phone}</span>}
                </>
              ) : (
                <span style={{ color: "#adb5bd", fontStyle: "italic" }}>{t("profile.noAddressSaved")}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="cl-dash-info-card__btn"
            onClick={() => setActiveTab("cards")}
          >
            {t("profile.editAddress")}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="cl-dash-stats">
        <div className="cl-dash-stat cl-dash-stat--blue">
          <div className="cl-dash-stat__icon cl-dash-stat__icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="1.8">
              <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div className="cl-dash-stat__info">
            <strong>{totalOrders}</strong>
            <span>{t("profile.totalOrders")}</span>
          </div>
        </div>

        <div className="cl-dash-stat cl-dash-stat--orange">
          <div className="cl-dash-stat__icon cl-dash-stat__icon--orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ef6b2a" strokeWidth="1.8">
              <path d="M12 22V12M12 12L7 7M12 12l5-5"/>
              <circle cx="12" cy="5" r="3"/>
            </svg>
          </div>
          <div className="cl-dash-stat__info">
            <strong>{String(pendingOrders).padStart(2, "0")}</strong>
            <span>{t("profile.pendingOrders")}</span>
          </div>
        </div>

        <div className="cl-dash-stat cl-dash-stat--green">
          <div className="cl-dash-stat__icon cl-dash-stat__icon--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="1.8">
              <rect x="2" y="7" width="20" height="15" rx="2"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <div className="cl-dash-stat__info">
            <strong>{completedOrders}</strong>
            <span>{t("profile.completedOrders")}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileDashboard;
